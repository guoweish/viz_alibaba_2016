#!/usr/bin/python
# -*- coding: utf-8 -*-
import csv
import re
# import urllib
# import baiduAddressGeo
# import time

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

#创建目标坐标文件，写入第一行标题栏
optimalSchedule = open('./optimalScheduleRealtime.csv', 'a')
try:
	optimalScheduleWriter = csv.writer(optimalSchedule)
	optimalScheduleWriter.writerow(('Courier_id', 'Addr', 'Arrival_time', 'Departure', 'Amount', 'Order_id', 'Addr_lng', 'Addr_lat', 'Departure_lng', 'Departure_lat', 'Arrival_lng', 'Arrival_lat'))
finally:
	optimalSchedule.close()

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
		# print onlineOrderGeo
	else:
		orderType = 'o2o'
		orderGeo = compareOrder(o2oOrderRowsData, orderId, orderType)
		# print o2oOrderGeo
	# print orderGeo
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
	print Courier_id, Addr, Arrival_time, Departure, Amount, orderId, addrGeoLng, addrGeoLat, departureAddressLng, departureAddressLat, arrivalAddressLng, arrivalAddressLat

	optimalSchedule = open('./optimalScheduleRealtime.csv', 'a')
	try:
		optimalScheduleWriter = csv.writer(optimalSchedule)
		optimalScheduleWriter.writerow((Courier_id, Addr, Arrival_time, Departure, Amount, orderId, addrGeoLng, addrGeoLat, departureAddressLng, departureAddressLat, arrivalAddressLng, arrivalAddressLat))
	finally:
		optimalSchedule.close()

print 'job done!'
scheduleData.close()
