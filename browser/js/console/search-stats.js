
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
        optionsChange: function() {
          this.setGroups();
          this.setAggs();
          return this.showStats();
        },
        showStats: function() {
          var agg_method, aggregation, date_histogram, esBody, group_by_field, title;
          $location.search('stats', this.serialize());
          if (chartStats.highChart) {
            chartStats.highChart.showLoading();
          }
          date_histogram = null;
          group_by_field = null;
          aggregation = null;
          if (this.type === 'event_count') {
            aggregation = {
              metric_value: {
                value_count: {}
              }
            };
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
          title = (this.selectedField ? this.selectedField.name + " " : "") + this.selectedAgg.title;
          return $http.post("/console/ajax/search", {
            esBody: esBody,
            begin: +$scope.startDate,
            end: +$scope.endDate
          }).success((function(_this) {
            return function(json) {
              var bucket, buckets, categories, chartHeight, data, series, _i, _len, _ref;
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
                  }).value().slice(0, 5);
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
                  return $scope.drawChart(chartStats, series);
                }
              } else if (_this.selectedChartType.value === 'bar') {
                buckets = json.aggregations.group_info.buckets;
                if (_this.selectedGroup) {
                  for (_i = 0, _len = buckets.length; _i < _len; _i++) {
                    bucket = buckets[_i];
                    data = ((_ref = bucket.metric_value) != null ? _ref.value : void 0) || bucket.doc_count;
                  }
                  categories = (function() {
                    var _j, _len1, _results;
                    _results = [];
                    for (_j = 0, _len1 = buckets.length; _j < _len1; _j++) {
                      bucket = buckets[_j];
                      _results.push(bucket.key);
                    }
                    return _results;
                  })();
                } else {
                  data = [json.aggregations.metric_value.value];
                  categories = ['全部'];
                }
                return $scope.drawChart(chartStats, [
                  {
                    name: title,
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
                        enabled: true
                      }
                    }
                  },
                  title: {
                    text: title
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
              }
            };
          })(this));
        }
      };
    };
  });

}).call(this);
