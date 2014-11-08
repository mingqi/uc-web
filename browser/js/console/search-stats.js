
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
          var field, newAggs, oldAggValue, _i, _len, _ref, _ref1, _ref2, _ref3;
          oldAggValue = (_ref = this.selectedAgg) != null ? _ref.value : void 0;
          this.groups = [];
          if (this.selectedField) {
            _ref1 = this.fields;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              field = _ref1[_i];
              if (field.key !== this.selectedField.key && !field.isNumeric) {
                this.groups.push(field);
              }
            }
          }
          if (((_ref2 = this.selectedGroup) != null ? _ref2.key : void 0) === ((_ref3 = this.selectedField) != null ? _ref3.key : void 0)) {
            this.selectedGroup = '';
          }
          newAggs = [];
          if (this.selectedField) {
            if (this.selectedField.isNumeric) {
              newAggs = [
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
              newAggs = [
                {
                  value: 'cardinality',
                  title: '唯一值数量'
                }
              ];
            }
          }
          if (newAggs.length !== this.aggs.length) {
            this.aggs = newAggs;
            this.selectedAgg = '';
          }
          return this.showStats();
        },
        changeAgg: function() {
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
                    return $scope.drawChart(chartStats, series, {
                      title: {
                        text: _this.selectedField.name + " " + _this.selectedAgg.title
                      }
                    });
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
                    var bucket, buckets;
                    buckets = json.aggregations.group_info.buckets;
                    $('#chartStats').height(60 + buckets.length * 35);
                    return $scope.drawChart(chartStats, [
                      {
                        name: _this.selectedField.name + " " + _this.selectedAgg.title,
                        data: (function() {
                          var _i, _len, _results;
                          _results = [];
                          for (_i = 0, _len = buckets.length; _i < _len; _i++) {
                            bucket = buckets[_i];
                            _results.push(bucket.metric_value.value);
                          }
                          return _results;
                        })(),
                        type: 'bar'
                      }
                    ], {
                      basicChart: 1,
                      plotOptions: {
                        bar: {
                          dataLabels: {
                            enabled: true
                          }
                        }
                      },
                      title: {
                        text: _this.selectedField.name + " " + _this.selectedAgg.title
                      },
                      xAxis: {
                        categories: (function() {
                          var _i, _len, _results;
                          _results = [];
                          for (_i = 0, _len = buckets.length; _i < _len; _i++) {
                            bucket = buckets[_i];
                            _results.push(bucket.key);
                          }
                          return _results;
                        })(),
                        title: {
                          text: null
                        }
                      },
                      yAxis: {
                        title: {
                          text: null
                        },
                        min: 0,
                        labels: {
                          overflow: 'justify'
                        }
                      }
                    });
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
                    $('#chartStats').height(100);
                    return $scope.drawChart(chartStats, [
                      {
                        name: _this.selectedAgg.title,
                        data: [json.aggregations.metric_value.value],
                        type: 'bar'
                      }
                    ], {
                      basicChart: 1,
                      plotOptions: {
                        bar: {
                          dataLabels: {
                            enabled: true
                          }
                        }
                      },
                      title: {
                        text: _this.selectedField.name + " " + _this.selectedAgg.title
                      },
                      xAxis: {
                        categories: ['全部'],
                        title: {
                          text: null
                        }
                      },
                      yAxis: {
                        title: {
                          text: null
                        },
                        min: 0,
                        labels: {
                          overflow: 'justify',
                          enabled: false
                        }
                      }
                    });
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
