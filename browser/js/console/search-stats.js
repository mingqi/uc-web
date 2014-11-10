
/* jshint ignore:start */

(function() {
  var chartStats, defaultAgg, getTimeData;

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
        var _ref1;
        data.push([bucket.key, ((_ref1 = bucket.metric_value) != null ? _ref1.value : void 0) || bucket.doc_count]);
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

  defaultAgg = {
    value: 'value_count',
    title: '数量'
  };

  define(['underscore'], function(_) {
    return function($scope, $http, $location) {
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
          this.aggs = [defaultAgg];
          this.groups = [];
          this.selectedChartType = this.chartTypes[0];
          return this.selectedAgg = this.aggs[0];
        },
        serialize: function() {
          var _ref, _ref1, _ref2, _ref3;
          return JSON.stringify({
            chartType: (_ref = this.selectedChartType) != null ? _ref.value : void 0,
            field: (_ref1 = this.selectedField) != null ? _ref1.key : void 0,
            agg: (_ref2 = this.selectedAgg) != null ? _ref2.value : void 0,
            group: (_ref3 = this.selectedGroup) != null ? _ref3.key : void 0
          });
        },
        deserialize: function() {
          var agg, chartType, e, field, group, selected, str, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _results;
          str = $location.search().stats;
          try {
            selected = JSON.parse(str);
            _ref = this.chartTypes;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              chartType = _ref[_i];
              if (chartType.value === selected.chartType) {
                this.selectedChartType = chartType;
                break;
              }
            }
            _ref1 = this.fields;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              field = _ref1[_j];
              if (field.key === selected.field) {
                this.selectedField = field;
                break;
              }
            }
            _ref2 = this.aggs;
            for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
              agg = _ref2[_k];
              if (agg.value === selected.agg) {
                this.selectedAgg = agg;
                break;
              }
            }
            _ref3 = this.groups;
            _results = [];
            for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
              group = _ref3[_l];
              if (group.key === selected.group) {
                this.selectedGroup = group;
                break;
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          } catch (_error) {
            e = _error;
          }
        },
        setFileds: function() {
          this.fields = $scope.fields;
          return this.setGroups();
        },
        setAggs: function() {
          var newAggs;
          newAggs = [
            {
              value: 'terms',
              title: '数量'
            }
          ];
          if (this.selectedField) {
            if (this.selectedField.isNumeric) {
              newAggs = [defaultAgg].concat([
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
              ]);
            } else {
              newAggs = [defaultAgg].concat([
                {
                  value: 'cardinality',
                  title: '唯一值数量'
                }
              ]);
            }
          }
          if (newAggs.length !== this.aggs.length) {
            this.aggs = newAggs;
            return this.selectedAgg = this.aggs[0];
          }
        },
        setGroups: function() {
          var field, _i, _len, _ref, _ref1, _ref2, _ref3;
          this.groups = [];
          _ref = this.fields;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            field = _ref[_i];
            if (field.key !== ((_ref1 = this.selectedField) != null ? _ref1.key : void 0) && !field.isNumeric) {
              this.groups.push(field);
            }
          }
          if (((_ref2 = this.selectedGroup) != null ? _ref2.key : void 0) === ((_ref3 = this.selectedField) != null ? _ref3.key : void 0)) {
            return this.selectedGroup = '';
          }
        },
        changeChartType: function() {
          return this.showStats();
        },
        changeField: function() {
          this.setGroups();
          this.setAggs();
          return this.showStats();
        },
        changeAgg: function() {
          return this.showStats();
        },
        changeGroup: function() {
          return this.showStats();
        },
        showStats: function() {
          var esBody, metricValue, title;
          $location.search('stats', this.serialize());
          if (this.selectedField || this.selectedGroup) {
            if (chartStats.highChart) {
              chartStats.highChart.showLoading();
            }
            metricValue = this.selectedField ? _.object([this.selectedAgg.value], [
              {
                field: this.selectedField.key
              }
            ]) : null;
            title = (this.selectedField ? this.selectedField.name + " " : "") + this.selectedAgg.title;
            if (this.selectedGroup) {
              if (this.selectedChartType.value === 'line') {
                esBody = {
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
                };
                if (!esBody.aggs.group_info.aggs.event_over_time.aggs.metric_value) {
                  delete esBody.aggs.group_info.aggs.event_over_time.aggs.metric_value;
                }
                return $http.post("/console/ajax/search", {
                  esBody: esBody,
                  begin: +$scope.startDate,
                  end: +$scope.endDate
                }).success((function(_this) {
                  return function(json) {
                    var series;
                    $('#chartStats').height(350);
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
                        text: title
                      }
                    });
                  };
                })(this));
              } else {
                esBody = {
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
                };
                if (!esBody.aggs.group_info.aggs.metric_value) {
                  delete esBody.aggs.group_info.aggs.metric_value;
                }
                return $http.post("/console/ajax/search", {
                  esBody: esBody,
                  begin: +$scope.startDate,
                  end: +$scope.endDate
                }).success((function(_this) {
                  return function(json) {
                    var bucket, buckets;
                    buckets = json.aggregations.group_info.buckets;
                    $('#chartStats').height(60 + buckets.length * 35);
                    return $scope.drawChart(chartStats, [
                      {
                        name: title,
                        data: (function() {
                          var _i, _len, _ref, _results;
                          _results = [];
                          for (_i = 0, _len = buckets.length; _i < _len; _i++) {
                            bucket = buckets[_i];
                            _results.push(((_ref = bucket.metric_value) != null ? _ref.value : void 0) || bucket.doc_count);
                          }
                          return _results;
                        })(),
                        type: 'bar'
                      }
                    ], {
                      basicChart: 1,
                      chart: {
                        renderTo: chartStats.id
                      },
                      plotOptions: {
                        bar: {
                          dataLabels: {
                            enabled: true
                          }
                        }
                      },
                      title: {
                        text: title
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
                        floor: 0,
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
                esBody = {
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
                };
                if (!esBody.aggs.event_over_time.aggs.metric_value) {
                  delete esBody.aggs.event_over_time.aggs.metric_value;
                }
                return $http.post("/console/ajax/search", {
                  esBody: esBody,
                  begin: +$scope.startDate,
                  end: +$scope.endDate
                }).success((function(_this) {
                  return function(json) {
                    var data, series;
                    $('#chartStats').height(300);
                    data = getTimeData(json.aggregations, $scope);
                    series = [
                      {
                        name: title,
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
                      chart: {
                        renderTo: chartStats.id
                      },
                      plotOptions: {
                        bar: {
                          dataLabels: {
                            enabled: true
                          }
                        }
                      },
                      title: {
                        text: title
                      },
                      xAxis: {
                        categories: ['全部'],
                        title: {
                          text: null
                        }
                      },
                      yAxis: {
                        floor: 0,
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
