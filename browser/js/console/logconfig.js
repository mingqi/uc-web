require(['jquery', 'underscore', 'con'],
function($, _, con) {

var setObject = function(list, object) {
  list = list || [];
  if (!_.some(list, function(old, i) {
      if (old._id === object._id) {
          list.splice(i, 1, object);
          return true;
      }
  })) {
      // new
      list.push(object);
  }
};
// var removeObject = function(list, object) {
//   list = list || [];
//   _.some(list, function(old, i) {
//     if (old._id === object._id) {
//       list.splice(i, 1);
//       return true;
//     }
//   })
// };

angular.module('consoleApp', ['tableSort'])
.controller('Ctrl', ['$scope', '$http', '$location', function($scope, $http, $location) {
  $http.get('/console/ajax/getHosts').success(function(hosts) {
      _.extend($scope, {
        page: {},
        hosts: hosts,
        newFiles: [{path: ''}],
        platforms: [{
            key: 'redhat',
            name: 'Red Hat 或者 CentOS'
        }, {
            key: 'debian',
            name: 'Ubuntu 或者 Debian'
        }, {
            key: 'linux',
            name: '其他 linux'
        }],
        agentUrl: {
          base: "http://download.uclogs.com/uc-agent/release/",
          bit32: "linux-i386.tar.gz",
          bit64: "linux-x86_64.tar.gz"
        }
      });
      venderPage();
      $scope.$on('$locationChangeSuccess', venderPage);
  });

  var venderPage = function() {
      $scope.mainContent = $location.search().tab;
      if (!$scope.mainContent) {
        $scope.mainContent = $scope.hosts.length === 0 ? 'addFile' : 'seeConfigs';
      }

      if ($scope.mainContent === 'addFile' && $scope.hosts.length === 0) {
        $scope.addHost();
      }
  };

  $scope.changeTab = function(tab) {
      if ($location.search().tab === tab) {
          return;
      }
      $location.search('tab', tab);
  };

  $scope.deleteFile = function(host, file) {
      if (!confirm('停止收集日志文件:\n\n' + host.hostname + ':' + file)) {
        return;
      }
      con.wait();
      $http.post('/console/ajax/deleteFile', {
        hostId: host._id,
        file: file
      }).success(function(host) {
        con.done();
        setObject($scope.hosts, host);
      });
  };

  $scope.refreshHosts = function() {
    $("#modalAddHost").modal('hide');
    con.wait();
    $http.get('/console/ajax/getHosts').success(function(hosts) {
        var oldHostMap = _.indexBy($scope.hosts, '_id');
        _.each(hosts, function(host) {
          host.selectedWhenAddFile = oldHostMap[host._id] && oldHostMap[host._id].selectedWhenAddFile;
        });        
        $scope.hosts = hosts;
        con.done();
    });
  };

  $scope.submitAddFiles = function() {
    var hostIds = _.chain($scope.hosts).filter(function(host) {
      return host.selectedWhenAddFile;
    }).map(function(host) {
      return host._id;
    }).value();

    if (!hostIds.length) {
      return;
    }

    con.wait();
    $http.post('/console/ajax/addFiles', {
      hostIds: hostIds,
      newFiles: _.map($scope.newFiles, function(file) {
        return file.path;
      })
    }).success(function(hosts) {
      con.done();
      $scope.changeTab('seeConfigs');
      _.each(hosts, function(host) {
        setObject($scope.hosts, host);
      });

      $scope.newFiles = [{path: ''}];
      _.extend($scope.hosts, {
        selectedWhenAddFile: false
      });
    });
  };

  $scope.addHost = function() {
    if ($scope.agentUrl.folder) {
      return $('#modalAddHost').modal();
    }
    $http.get('http://download.uclogs.com/uc-agent/release/latestVersion.txt?' + new Date() * 1)
    .success(function(version) {
      $scope.agentUrl.folder = "uc-agent-" + version.replace(/\s+$/g, '');
      $scope.addHost();
    });
  };

  $scope.addHostFile = function(host) {
    _.each($scope.hosts, function(h) {
      h.selectedWhenAddFile = h._id === host._id;
    });
    $scope.changeTab('addFile');
  };
}]);

$(function() {
  angular.bootstrap(document, ['consoleApp']);  
});

}); // end require ['jquery', ...]
