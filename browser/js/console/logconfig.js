require(['jquery', 'underscore', 'angular', 'con'],
function($, _, ng) {

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
var removeObject = function(list, object) {
  list = list || [];
  _.some(list, function(old, i) {
    if (old._id === object._id) {
      list.splice(i, 1);
      return true;
    }
  })
}

ng.module('consoleApp', ['tableSort'])
.controller('Ctrl', ['$scope', '$http', '$location', function($scope, $http, $location) {
  $http.get('/console/ajax/getHosts').success(function(hosts) {
      _.extend($scope, {
        page: {},
        hosts: hosts,
        newFiles: [],
        platforms: [{
            key: 'redhat',
            name: 'Red Hat or CentOS'
        }, {
            key: 'debian',
            name: 'Ubuntu or Debian'
        }, {
            key: 'linux',
            name: 'Others linux'
        }]
      });
      venderPage();
      $scope.$on('$locationChangeSuccess', venderPage);
  });

  var venderPage = function() {
      var locationSearch = $location.search();
      $scope.mainContent = locationSearch.tab || 'seeConfigs';
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
      ma.wait();
      $http.post('/console/ajax/deleteFile', {
        hostId: host._id,
        file: file
      }).success(function(host) {
        ma.done();
        setObject($scope.hosts, host);
      });
  };

  $scope.refreshHosts = function() {
    ma.wait();
    $http.get('/console/ajax/getHosts').success(function(hosts) {
        var oldHostMap = _.indexBy($scope.hosts, '_id');
        _.each(hosts, function(host) {
          host.selectedWhenAddFile = oldHostMap[host._id] && oldHostMap[host._id].selectedWhenAddFile;
        });        
        $scope.hosts = hosts;
        ma.done();
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

    ma.wait();
    $http.post('/console/ajax/addFiles', {
      hostIds: hostIds,
      newFiles: _.map($scope.newFiles, function(file) {
        return file.path;
      })
    }).success(function(hosts) {
      ma.done();
      $scope.changeTab('seeConfigs');
      _.each(hosts, function(host) {
        setObject($scope.hosts, host);
      });

      $scope.newFiles = [];
      _.extend($scope.hosts, {
        selectedWhenAddFile: false
      });
    });
  };
}]);

ng.bootstrap(document, ['consoleApp']);

}); // end require ['jquery', ...]
