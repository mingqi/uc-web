
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

  define(['underscore'], function(_) {
    return function($scope, $http, $location) {
      return $scope.stats = {
        init: function() {
          this.chartTypes = [
            {
              icon: 'fa-line-chart',
              value: 'line',
              text: '折线图'
            }, {
              icon: 'fa-bar-chart',
              value: 'bar',
              text: '柱状图'
            }, {
              icon: 'fa-pie-chart',
              value: 'pie',
              text: '饼图'
            }
          ];
          this.aggs = [];
          this.groups = [];
          this.selectedChartType = this.chartTypes[0];
          this.selectedAgg = this.aggs[0];
          return this.type = 'event_count';
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
          this.selectedField = this.fields[0];
          return this.setGroups();
        },
        setAggs: function() {
          var newAggs;
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
                  title: '不重复数量'
                }
              ];
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
            if (field.isNumeric) {
              continue;
            }
            if (this.type !== 'event_count' && field.key === ((_ref1 = this.selectedField) != null ? _ref1.key : void 0)) {
              continue;
            }
            this.groups.push(field);
          }
          if (this.type !== 'event_count') {
            if (((_ref2 = this.selectedGroup) != null ? _ref2.key : void 0) === ((_ref3 = this.selectedField) != null ? _ref3.key : void 0)) {
              return this.selectedGroup = '';
            }
          }
        },
        chartTypeChange: function(type) {
          this.selectedChartType = type;
          return this.optionsChange();
        },
        optionsChange: function() {
          this.setGroups();
          this.setAggs();
          return this.showStats();
        },
        showStats: function() {
          var agg_method, aggregation, esBody, title;
          if ($scope.page.tab !== 'stats') {
            return;
          }
          $location.search('stats', this.serialize());
          if (chartStats.highChart != null) {
            chartStats.highChart.showLoading();
          }
          aggregation = null;
          if (this.type === 'event_count') {
            aggregation = {};
          } else {
            agg_method = this.selectedAgg.value;
            aggregation = {
              metric_value: {}
            };
            aggregation.metric_value[this.selectedAgg.value] = {
              field: this.selectedField.key
            };
          }
          if (this.selectedChartType.value === 'line') {
            aggregation = {
              event_over_time: {
                date_histogram: {
                  field: 'timestamp',
                  interval: $scope.interval + "ms"
                },
                aggs: aggregation
              }
            };
          }
          if (this.selectedGroup) {
            aggregation = {
              group_info: {
                terms: {
                  field: this.selectedGroup.key,
                  size: 10
                },
                aggs: aggregation
              }
            };
          }
          esBody = {
            query: $scope.page.query,
            size: 0,
            aggs: aggregation
          };

          /* chart title */
          title = '';
          if (this.type === 'event_count') {
            title = '日志数量';
          } else {
            if (this.selectedField) {
              title += this.selectedField.name;
            }
            if (this.selectedAgg) {
              title += ' - ' + this.selectedAgg.title;
            }
          }
          return $http.post("/console/ajax/search", {
            esBody: esBody,
            begin: +$scope.startDate,
            end: +$scope.endDate
          }).success((function(_this) {
            return function(json) {
              var bucket, buckets, categories, chartHeight, data, series;
              chartHeight = 0;
              if (_this.selectedChartType.value === 'line') {
                if (_this.selectedGroup) {
                  chartHeight = 350;
                } else {
                  chartHeight = 300;
                }
              } else if (_this.selectedChartType.value === 'bar') {
                if (_this.selectedGroup) {
                  buckets = json.aggregations.group_info.buckets;
                  chartHeight = 60 + buckets.length * 35;
                } else {
                  chartHeight = 100;
                }
              } else if (_this.selectedChartType.value === 'pie') {
                chartHeight = 300;
              }
              $('#chartStats').height(chartHeight);
              if (_this.selectedChartType.value === 'line') {
                if (_this.selectedGroup) {
                  series = _.chain(json.aggregations.group_info.buckets).map(function(bucket) {
                    var data;
                    data = getTimeData(bucket, $scope);
                    return {
                      name: bucket.key,
                      type: 'line',
                      data: data
                    };
                  }).value();
                  return $scope.drawChart(chartStats, series, {
                    title: {
                      text: title
                    }
                  });
                } else {
                  data = getTimeData(json.aggregations, $scope);
                  series = [
                    {
                      name: title,
                      type: 'line',
                      data: data
                    }
                  ];
                  return $scope.drawChart(chartStats, series, {
                    title: {
                      text: title
                    }
                  });
                }
              } else if (_this.selectedChartType.value === 'bar') {
                if (_this.type === 'event_count') {
                  if (_this.selectedGroup) {
                    buckets = json.aggregations.group_info.buckets;
                    data = (function() {
                      var _i, _len, _results;
                      _results = [];
                      for (_i = 0, _len = buckets.length; _i < _len; _i++) {
                        bucket = buckets[_i];
                        _results.push(bucket.doc_count);
                      }
                      return _results;
                    })();
                    categories = (function() {
                      var _i, _len, _results;
                      _results = [];
                      for (_i = 0, _len = buckets.length; _i < _len; _i++) {
                        bucket = buckets[_i];
                        _results.push(bucket.key);
                      }
                      return _results;
                    })();
                  } else {
                    data = [json.hits.total];
                    categories = ['全部'];
                  }
                } else {
                  if (_this.selectedGroup) {
                    buckets = json.aggregations.group_info.buckets;
                    data = (function() {
                      var _i, _len, _results;
                      _results = [];
                      for (_i = 0, _len = buckets.length; _i < _len; _i++) {
                        bucket = buckets[_i];
                        _results.push(bucket.metric_value.value);
                      }
                      return _results;
                    })();
                    categories = (function() {
                      var _i, _len, _results;
                      _results = [];
                      for (_i = 0, _len = buckets.length; _i < _len; _i++) {
                        bucket = buckets[_i];
                        _results.push(bucket.key);
                      }
                      return _results;
                    })();
                  } else {
                    data = [json.aggregations.metric_value.value];
                    categories = ['全部'];
                  }
                }
                return $scope.drawChart(chartStats, [
                  {
                    data: data,
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
                        enabled: true,
                        formatter: function() {
                          return Highcharts.numberFormat(this.y, 0);
                        }
                      }
                    }
                  },
                  title: {
                    text: title
                  },
                  tooltip: {
                    valueDecimals: 0,
                    pointFormat: '<b>{point.y}</b>'
                  },
                  xAxis: {
                    categories: categories,
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
              } else if (_this.selectedChartType.value === 'pie') {
                if (_this.type === 'event_count') {
                  if (_this.selectedGroup) {
                    buckets = json.aggregations.group_info.buckets;
                    data = (function() {
                      var _i, _len, _results;
                      _results = [];
                      for (_i = 0, _len = buckets.length; _i < _len; _i++) {
                        bucket = buckets[_i];
                        _results.push([bucket.key, bucket.doc_count]);
                      }
                      return _results;
                    })();
                  } else {
                    data = [['全部', json.hits.total]];
                  }
                } else {
                  if (_this.selectedGroup) {
                    buckets = json.aggregations.group_info.buckets;
                    data = (function() {
                      var _i, _len, _results;
                      _results = [];
                      for (_i = 0, _len = buckets.length; _i < _len; _i++) {
                        bucket = buckets[_i];
                        _results.push([bucket.key, bucket.metric_value.value]);
                      }
                      return _results;
                    })();
                  } else {
                    data = [['全部', json.aggregations.metric_value.value]];
                  }
                }
                console.log("pie data=" + (JSON.stringify(data)));
                data = data.map(function(_arg) {
                  var name, value;
                  name = _arg[0], value = _arg[1];
                  if (_.isNumber(name)) {
                    name = name.toString();
                  }
                  return [name, value];
                });
                return $scope.drawChart(chartStats, [
                  {
                    data: data
                  }
                ], {
                  basicChart: 1,
                  chart: {
                    renderTo: chartStats.id,
                    type: 'pie'
                  },
                  plotOptions: {
                    pie: {
                      allowPointSelect: true,
                      cursor: 'pointer',
                      dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                      }
                    }
                  },
                  title: {
                    text: title
                  },
                  tooltip: {
                    pointFormat: '<b>{point.percentage:.1f} %</b>'
                  }
                });
              }
            };
          })(this));
        }
      };
    };
  });

}).call(this);
