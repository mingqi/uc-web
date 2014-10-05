db.users.insert({ "_id" : ObjectId("542b79a16246d50000000002"), "email" : "blogbbs@gmail.com", "passwordMd5" : "362977b0466a8317693d7da03fb2a7d3", "licenseKey" : "JGU1MiQOLWzlG898bJvQ", "roles" : [ ], "__v" : 0 })
db.users.update({"email" : "blogbbs@gmail.com"},{$set:{roles:['admin']}})

db.hosts.insert({
	"_id" : ObjectId("542b86ced486e035d39a7a7e"),
	userId: '542b79a16246d50000000002',
	hostname: 'dev-web-01.uclogs.com',
	files: ["/var/logs/web.log", "/var/logs/app.log", "/var/logs/apache.log"],
})

db.hosts.insert({
	"_id" : ObjectId("542b86ead486e035d39a7a7f"),
	userId: '542b79a16246d50000000002',
	hostname: 'dev-web-02.uclogs.com',
	files: ["/var/logs/web.log", "/var/logs/app.log", "/var/logs/nginx.log"],
})

db.hosts.insert({
	hostname: 'dev-web-03.uclogs.com',
	files: ["/var/logs/tomcat.log", "/var/logs/error.log", "/var/logs/ngxin.log"],
})

db.hosts.insert({
	hostname: 'dev-web-04.uclogs.com',
	files: ["/var/logs/tomcat.log", "/var/logs/error.log", "/var/logs/access.log"],
})


db.hosts.insert({
	userId: '542b79a16246d50000000002',
	hostname: 'app-01.tushucheng.com',
})


db.hosts.insert({
	userId: '542b79a16246d50000000002',
	hostname: 'app-02.tushucheng.com',
})


db.hosts.insert({
	userId: '542b79a16246d50000000002',
	hostname: 'app-03.tushucheng.com',
})


/////////

db.hosts.update({"_id" : ObjectId("542b86ced486e035d39a7a7e")}, {
	userId: '542b79a16246d50000000002',
	hostname: 'dev-web-01.uclogs.com',
	files: ["/var/logs/web.log", "/var/logs/app.log", "/var/logs/apache.log"],
})

db.hosts.update({"_id" : ObjectId("542b86ead486e035d39a7a7f")}, {
	userId: '542b79a16246d50000000002',
	hostname: 'dev-web-02.uclogs.com',
	files: ["/var/logs/web.log", "/var/logs/app.log", "/var/logs/nginx.log"],
})
