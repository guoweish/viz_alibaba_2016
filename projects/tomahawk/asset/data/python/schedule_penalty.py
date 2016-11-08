#!/usr/bin/python
# -*- coding: utf-8 -*-
import csv
import re
# import urllib
# import baiduAddressGeo
# import time

# ---------------------------------------------------------------
# 定义函数
# 通过站点编号获取经纬度信息
def matchGeoData(address, addressGeoCollection):
	for row in addressGeoCollection:
		siteId = row[0]
		if siteId == address:
			siteLng = row[1]
			siteLat = row[2]
			# print siteLng, siteLat
			return [siteLng, siteLat]


# 根据订单确定送货和收货的站点编号
def compareOrder(orderCollection, orderId, orderType):
	for orderRow in orderCollection:
		orderIdInCollection = orderRow[0]
		if orderIdInCollection == orderId:
			# print 'hitted'
			arrivalAddress = orderRow[1]
			departureAddress = orderRow[2]
			# print arrivalAddress, departureAddress
			if orderType == 'online':
				# print 'online departureAddress'
				onlineDepartureAddressGeo = matchGeoData(departureAddress, siteRowsData)
				# print onlineDepartureAddress
				# print 'online arrivalAddress'
				onlineArrivalAddressGeo = matchGeoData(arrivalAddress, spotRowsData)
				return [onlineDepartureAddressGeo, onlineArrivalAddressGeo]
			else:
				# print 'o2o departureAddress'
				o2oDepartureAddressGeo = matchGeoData(departureAddress, shopRowsData)
				# print 'o2o arrivalAddress'
				o2oArrivalAddressGeo = matchGeoData(arrivalAddress, spotRowsData)
				return [o2oDepartureAddressGeo, o2oArrivalAddressGeo]

# 根据调度计划快递员地址，从三类地点中返回经纬度
def getAddrGeo(addr, siteRowsData, shopRowsData, spotRowsData):
	isSite = re.match('^A', addr)
	isShop = re.match('^S', addr)

	if isSite:
		return matchGeoData(addr, siteRowsData)
	elif isShop:
		return matchGeoData(addr, shopRowsData)
	else:
		return matchGeoData(addr, spotRowsData)

# 将时间字符串转换为分钟计时
def convertTimeToMinutes(timeInput):
	timeSplited = timeInput.split(':')
	timeHour = int(timeSplited[0])
	timeMinutes = int(timeSplited[1])
	# 8点开始计算时间，最后转换为分钟计时
	timeConvertToMinutes = (timeHour - 8) * 60 + timeMinutes
	return timeConvertToMinutes

# 根据调度计划计算每单罚时
def computerPenaltyTime(scheduleRow, o2oOrderRowsData):
	# print 'computerPenaltyTime'
	penaltyMultiplyer = 5
	scheduleOrderId = scheduleRow[5]
	scheduleArrivalTime = int(scheduleRow[2])
	scheduleDepartureTime = int(scheduleRow[3])
	scheduleAddress = scheduleRow[1]
	# 以S开头的地址是取外卖的O2O订单
	isPickUpSchedule = re.match('^S', scheduleAddress)

	for row in o2oOrderRowsData:
		orderIdInCollection = row[0]
		shopAddress = row[2]
		if orderIdInCollection == scheduleOrderId:
			# 如果schedule地址与o2o商店shop地址一致，则该调度是快递员从店里取包裹

			pickUpTime = row[3]
			pickUpTimeConvertToMinutes = convertTimeToMinutes(pickUpTime)
			deliveryTime = row[4]
			deliveryTimeConvertToMinutes = convertTimeToMinutes(deliveryTime)
			# print pickUpTimeConvertToMinutes, deliveryTimeConvertToMinutes
			# 取外卖晚点时间
			if isPickUpSchedule:
				pickUpTimeBias = abs(scheduleArrivalTime - pickUpTimeConvertToMinutes)
			# 送外卖晚点时间
			else:
				pickUpTimeBias = abs(scheduleArrivalTime - deliveryTimeConvertToMinutes)
			print (pickUpTimeBias * penaltyMultiplyer)
			return pickUpTimeBias * penaltyMultiplyer

# ---------------------------------------------------------------
#读入原始记录文件
# scheduleData = open('./schedule.csv', 'rb')
scheduleData = open('./schedule.csv', 'rU')
# scheduleData = open('./schedule_simple.csv', 'rU')
scheduleDataRows = csv.reader(scheduleData)

onlineOrder = open('./online_order.csv', 'rU')
# onlineOrder = open('./online_order_simple.csv', 'rb')
onlineOrderRows = csv.reader(onlineOrder)

o2oOrder = open('./o2o_order.csv', 'rU')
# o2oOrder = open('./o2o_order_simple.csv', 'rb')
o2oOrderRows = csv.reader(o2oOrder)

site = open('./site.csv', 'rU')
siteRows = csv.reader(site)

spot = open('./spot.csv', 'rU')
spotRows = csv.reader(spot)

shop = open('./shop.csv', 'rU')
shopRows = csv.reader(shop)

# 将csv数据转换为数组，否则不能正常嵌套循环读取
scheduleDataRowsData = [x for x in scheduleDataRows]
onlineOrderRowsData = [x for x in onlineOrderRows]
o2oOrderRowsData = [x for x in o2oOrderRows]
siteRowsData = [x for x in siteRows]
spotRowsData = [x for x in spotRows]
shopRowsData = [x for x in shopRows]

# ---------------------------------------------------------------
# #创建目标坐标文件，写入第一行标题栏
optimalSchedule = open('./schedulePenalty.csv', 'a')
try:
	optimalScheduleWriter = csv.writer(optimalSchedule)
	optimalScheduleWriter.writerow(('Courier_id', 'Addr', 'Arrival_time', 'Departure', 'Amount', 'Order_id', 'Addr_lng', 'Addr_lat', 'Departure_lng', 'Departure_lat', 'Arrival_lng', 'Arrival_lat', 'Penalty_time'))
finally:
	optimalSchedule.close()


# ---------------------------------------------------------------
#处理原始文件每一行
for row in scheduleDataRowsData:
	orderId = row[5]
	addr = row[1]

	addrGeo = getAddrGeo(addr, siteRowsData, shopRowsData, spotRowsData)
	addrGeoLng = addrGeo[0]
	addrGeoLat = addrGeo[1]

	isOnlineOrder = re.match('^F', orderId)

	if isOnlineOrder:
		orderType = 'online'
		orderGeo = compareOrder(onlineOrderRowsData, orderId, orderType)
		# 计算罚时
		penaltyTime = 0
	else:
		orderType = 'o2o'
		orderGeo = compareOrder(o2oOrderRowsData, orderId, orderType)
		# 计算罚时
		penaltyTime = computerPenaltyTime(row, o2oOrderRowsData)

	departureAddressLng = orderGeo[0][0]
	departureAddressLat = orderGeo[0][1]
	arrivalAddressLng = orderGeo[1][0]
	arrivalAddressLat = orderGeo[1][1]
	# print departureAddressLng, departureAddressLat, arrivalAddressLng, arrivalAddressLat
	Courier_id = row[0]
	Addr = row[1]
	Arrival_time = row[2]
	Departure = row[3]
	Amount = row[4]
	print Courier_id, Addr, Arrival_time, Departure, Amount, orderId, addrGeoLng, addrGeoLat, departureAddressLng, departureAddressLat, arrivalAddressLng, arrivalAddressLat, penaltyTime

	optimalSchedule = open('./schedulePenalty.csv', 'a')
	try:
		optimalScheduleWriter = csv.writer(optimalSchedule)
		optimalScheduleWriter.writerow((Courier_id, Addr, Arrival_time, Departure, Amount, orderId, addrGeoLng, addrGeoLat, departureAddressLng, departureAddressLat, arrivalAddressLng, arrivalAddressLat, penaltyTime))
	finally:
		optimalSchedule.close()

print '============ >>> >>> >>> job done!'

# ---------------------------------------------------------------
# 关闭读取数据源文件
scheduleData.close()
onlineOrder.close()
o2oOrder.close()
site.close()
spot.close()
shop.close()
