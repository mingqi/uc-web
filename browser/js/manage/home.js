require(['jquery', 'underscore', 'angular', 'ace'],
function($, _) {

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
// }

var objToDate = function(obj) {
  return new Date(parseInt(obj._id.substring(0, 8), 16) * 1000);
};

angular.module('ngApp', [])
.controller('Ctrl', ['$scope', '$http', '$location', function($scope, $http, $location) {
  $http.get('/manage/ajax/getUsers').success(function(users) {
      _.extend($scope, {
        _: _,
        objToDate: objToDate,
        page: {},
        users: users
      });
      venderPage();
      $scope.$on('$locationChangeSuccess', venderPage);
  });

  var venderPage = function() {
      var locationSearch = $location.search();
      $scope.mainContent = locationSearch.tab || 'allUsers';

      if ($scope.mainContent === 'inviteCode'  && !$scope.inviteCodes) {
        $http.get('/manage/ajax/getInviteCodes').success(function(codes) {
          $scope.inviteCodes = codes;
        });
      }
  };

  $scope.changeTab = function(tab) {
      if ($location.search().tab === tab) {
          return;
      }
      $location.search('tab', tab);
  };

  $scope.createInviteCode = function(goal, num) {
    num = num || 1;
    $http.post('/manage/ajax/createInviteCodes', {
      num: num,
      goal: goal
    }).success(function(codes) {
      _.each(codes, function(code) {
        setObject($scope.inviteCodes, code);
      });
    });
  }
}]);

$(function() {
  angular.bootstrap(document, ['ngApp']);  
});

}); // end require ['jquery', ...]
