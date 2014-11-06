
/* jshint ignore:start */

(function() {
  var chartStats, getTimeData;

  getTimeData = function(timeAgg, $scope) {
    var add, buckets, data, date, endDate, from, minus, startDate, to, _ref;
    _ref = [$scope.startDate, $scope.endDate], startDate = _ref[0], endDate = _ref[1];
    buckets = (timeAgg != null ? timeAgg.event_over_time.buckets : void 0) || [];
    data = [];
    if (buckets.length === 0) {
      date = +startDate;
      while (date <= +endDate) {
        data.push([date, 0]);
        date += $scope.interval;
      }
    } else {
      add = (buckets[0].key - startDate) % $scope.interval;
      minus = (endDate - buckets[0].key) % $scope.interval;
      from = startDate + add;
      to = endDate - minus;
      if (from < buckets[0].key) {
        data.push([from, 0]);
      }
      _.each(buckets, function(bucket) {
        data.push([bucket.key, bucket.metric_value.value]);
      });
      if (buckets.length > 1 && to > buckets[buckets.length - 1].key) {
        data.push([to, 0]);
      }
    }
    return data;
  };

  chartStats = {
    id: 'chartStats'
  };

  define(['underscore', 'scrollTo'], function(_, $scrollTo) {
    return function($scope, $http) {
      return $scope.stats = {
        init: function() {
          this.chartTypes = [
            {
              value: 'line',
              text: '折线图'
            }, {
              value: 'bar',
              text: '柱状图'
            }
          ];
          this.aggs = [];
          this.groups = [];
          return this.selectedChartType = this.chartTypes[0];
        },
        setFileds: function() {
          return this.fields = $scope.fields;
        },
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
            if (chartStats.highChart) {
              chartStats.highChart.showLoading();
            }
            this.loading = true;
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
                }).success((function(_this) {
                  return function(json) {
                    var series;
                    series = _.chain(json.aggregations.group_info.buckets).map(function(bucket) {
                      var data;
                      data = getTimeData(bucket, $scope);
                      return {
                        name: bucket.key,
                        type: 'line',
                        data: data
                      };
                    }).value().slice(0, 4);
                    return $scope.drawChart(chartStats, series, _this.selectedField.name + " " + _this.selectedAgg.title);
                  };
                })(this));
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
                }).success((function(_this) {
                  return function(json) {
                    var maxValue, serie, _i, _len, _ref;
                    _this.loading = false;
                    _this.title = _this.selectedField.name + " " + _this.selectedAgg.title;
                    _this.series = _.map(json.aggregations.group_info.buckets, function(bucket) {
                      return {
                        title: bucket.key,
                        value: bucket.metric_value.value
                      };
                    });
                    maxValue = _.reduce(_this.series, function(memo, serie) {
                      return Math.max(memo, serie.value);
                    }, 0);
                    console.log(maxValue);
                    _ref = _this.series;
                    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                      serie = _ref[_i];
                      serie.percent = parseInt(serie.value * 100 / maxValue);
                    }
                    return console.log(serie.percent);
                  };
                })(this));
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
                }).success((function(_this) {
                  return function(json) {
                    var data, series;
                    data = getTimeData(json.aggregations, $scope);
                    series = [
                      {
                        name: _this.selectedField.name + " " + _this.selectedAgg.title,
                        type: 'line',
                        data: data
                      }
                    ];
                    return $scope.drawChart(chartStats, series);
                  };
                })(this));
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
                }).success((function(_this) {
                  return function(json) {
                    _this.loading = false;
                    _this.title = _this.selectedField.name + " " + _this.selectedAgg.title;
                    return _this.series = [
                      {
                        title: '全部',
                        value: json.aggregations.metric_value.value,
                        percent: 60
                      }
                    ];
                  };
                })(this));
              }
            }
          }
        }
      };
    };
  });

}).call(this);
