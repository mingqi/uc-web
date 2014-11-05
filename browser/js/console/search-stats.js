
/* jshint ignore:start */

(function() {
  define(['underscore', 'scrollTo'], function(_, $scrollTo) {
    return function($scope, $http) {
      var $stats;
      $stats = $scope.stats = {
        chartTypes: [
          {
            value: 'line',
            text: '折线图'
          }, {
            value: 'bar',
            text: '柱状图'
          }
        ],
        fields: $scope.fields,
        aggs: [],
        groups: [],
        changeChartType: function() {
          return this.showStats();
        },
        changeField: function() {
          this.aggs = [];
          if (this.selectedField) {
            if (this.selectedField.isNumeric) {
              this.aggs = [
                {
                  value: 'avg',
                  title: '平均'
                }, {
                  value: 'sum',
                  title: '求和'
                }, {
                  value: 'max',
                  title: '最大值'
                }, {
                  value: 'min',
                  title: '最小值'
                }
              ];
            } else {
              this.aggs = [
                {
                  value: 'cardinality',
                  title: '唯一值数量'
                }
              ];
            }
          }
          return this.selectedAgg = null;
        },
        changeAgg: function() {
          var field, _i, _len, _ref;
          this.groups = [];
          if (this.selectedAgg) {
            _ref = this.fields;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              field = _ref[_i];
              if (field.key !== this.selectedField.key && !field.isNumeric) {
                this.groups.push(field);
              }
            }
          }
          this.selectedGroup = '';
          return this.showStats();
        },
        changeGroup: function() {
          return this.showStats();
        },
        showStats: function() {
          var metricValue;
          if (this.selectedField && this.selectedAgg) {
            metricValue = _.object([this.selectedAgg.value], [
              {
                field: this.selectedField.key
              }
            ]);
            if (this.selectedGroup) {
              if (this.selectedChartType.value === 'line') {
                return $http.post("/console/ajax/search", {
                  esBody: {
                    query: $scope.page.query,
                    size: 0,
                    aggs: {
                      group_info: {
                        terms: {
                          field: this.selectedGroup.key,
                          size: 10
                        },
                        aggs: {
                          event_over_time: {
                            date_histogram: {
                              field: "timestamp",
                              interval: $scope.interval + "ms"
                            },
                            aggs: {
                              metric_value: metricValue
                            }
                          }
                        }
                      }
                    }
                  },
                  begin: +$scope.startDate,
                  end: +$scope.endDate
                }).success(function(json) {});
              } else {
                return $http.post("/console/ajax/search", {
                  esBody: {
                    query: $scope.page.query,
                    size: 0,
                    aggs: {
                      group_info: {
                        terms: {
                          field: this.selectedGroup.key,
                          size: 10
                        },
                        aggs: {
                          metric_value: metricValue
                        }
                      }
                    }
                  },
                  begin: +$scope.startDate,
                  end: +$scope.endDate
                }).success(function(json) {});
              }
            } else {
              if (this.selectedChartType.value === 'line') {
                return $http.post("/console/ajax/search", {
                  esBody: {
                    query: $scope.page.query,
                    size: 0,
                    aggs: {
                      event_over_time: {
                        date_histogram: {
                          field: "timestamp",
                          interval: $scope.interval + "ms"
                        },
                        aggs: {
                          metric_value: metricValue
                        }
                      }
                    }
                  },
                  begin: +$scope.startDate,
                  end: +$scope.endDate
                }).success(function(json) {});
              } else {
                return $http.post("/console/ajax/search", {
                  esBody: {
                    query: $scope.page.query,
                    size: 0,
                    aggs: {
                      metric_value: metricValue
                    }
                  },
                  begin: +$scope.startDate,
                  end: +$scope.endDate
                }).success(function(json) {});
              }
            }
          }
        }
      };
      return $stats.selectedChartType = $stats.chartTypes[0];
    };
  });

}).call(this);
