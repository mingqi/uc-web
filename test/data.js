db.users.insert({ "_id" : ObjectId("542b79a16246d50000000002"), "email" : "blogbbs@gmail.com", "passwordMd5" : "362977b0466a8317693d7da03fb2a7d3", "licenseKey" : "JGU1MiQOLWzlG898bJvQ", "roles" : [ ], "__v" : 0 })

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

db.logconfigs.insert({
	userId: '542b79a16246d50000000002',
    hostId: '542b86ced486e035d39a7a7e',
    files: ["/var/logs/web.log", "/var/logs/app.log", "/var/logs/apache.log"],
})

db.logconfigs.insert({
	userId: '542b79a16246d50000000002',
    hostId: '542b86ead486e035d39a7a7f',
    files: ["/var/logs/web.log", "/var/logs/app.log", "/var/logs/nginx.log"],
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
