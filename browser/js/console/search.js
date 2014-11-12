require(['jquery', 'underscore', 'con', 'moment', 'scrollTo', 'pattern', 'searchStats',
         'highstock', 'daterangepicker', 'pattern', 'angular-sanitize'],
function($, _, con, moment, $scrollTo, pattern, searchStats) {

Highcharts.setOptions({
    global : {
        timezoneOffset : new Date().getTimezoneOffset()
    },
    lang: {
      weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      //shortMonths: _.map(_.range(12), function(i) {return (i+1)+"月"})
      //shortMonths: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
    }
});

var dateFormat = 'YYYY-MM-DD HH:mm:ss';
var chosenLabel = '过去1小时';
var startDate, endDate;
var getRanges = function() {
  var ranges = {
     '过去1小时': [moment().subtract(1, 'hour'), moment()],
     '过去6小时': [moment().subtract(6, 'hour'), moment()],
     '今天': [moment().startOf('day'), moment()],
     '昨天': [moment().subtract(1, 'day').startOf('day'), moment().subtract(1, 'day').endOf('day')],
     '过去1天': [moment().subtract(1, 'day'), moment()],
     '过去1周': [moment().subtract(1, 'week'), moment()],
     '过去15天': [moment().subtract(15, 'day'), moment()]
  };

  var range = ranges[chosenLabel];
  if (range) {
    startDate = range[0];
    endDate = range[1];
  }
  return ranges;
};

var dateRangePickerOptions = {
    opens: 'left',
    timePicker: true,
    timePicker12Hour: false,
    timePickerIncrement: 15,
    ranges: getRanges(),
    format: dateFormat,
    minDate: moment().subtract(15, 'day'),
    maxDate: moment(),
    separator: " 到 ",
    locale: {
        applyLabel: '应用',
        cancelLabel: '取消',
        fromLabel: '从',
        toLabel: '到',
        weekLabel: 'W',
        customRangeLabel: '自定义范围',
        daysOfWeek: moment.weekdaysMin(),
        monthNames: moment.monthsShort(),
        firstDay: moment.localeData()._week.dow
    },
    startDate: startDate,
    endDate: endDate
};

var emitDateRangeChange = function($scope) {
  setAutoInterval($scope);
  $scope.availableIntervals = getAvailableIntervals();
  $scope.search();
};

var initDateRangePicker = function($scope, locationSearch) {
  if (locationSearch.b && locationSearch.e) {
    var b = moment(parseFloat(locationSearch.b));
    var e = moment(parseFloat(locationSearch.e));
    if (b.isValid() && e.isValid() && b.isBefore(e) &&
        moment().subtract(20, 'day').isBefore(b) &&
        moment().add(1, 'day').isAfter(e)) {
      startDate = b;
      endDate = e;
      chosenLabel = "自定义范围";
    }
  }

  $scope.startDate = startDate;
  $scope.endDate = endDate;

  $('#daterange').daterangepicker(dateRangePickerOptions);
  $('#daterange').on('apply.daterangepicker', function(ev, picker) {
      chosenLabel = picker.chosenLabel;
      $scope.startDate = startDate = picker.startDate;
      $scope.endDate = endDate = picker.endDate;
      emitDateRangeChange($scope);
  });
};

var updateDateRangePicker = function($scope) {
  var ranges = getRanges();
  if (chosenLabel === "自定义范围") {
    $scope.dateRange = startDate.format(dateFormat) + " 到 " + endDate.format(dateFormat);
  } else {
    $scope.dateRange = chosenLabel;
  }

  var opts = _.extend(dateRangePickerOptions, {
    ranges: ranges,
    startDate: startDate,
    endDate: endDate,
    minDate: moment().subtract(15, 'day'),
    maxDate: moment(),
  });
  $('#daterange').data('daterangepicker').setOptions(opts);
};

var drawChart = function(chart, series, opts) {
    $scope = this;
    if (chart.highChart) {
        chart.highChart.destroy();
    }
    var defaultOpts = {
        chart : {
            renderTo : chart.id,
            zoomType : 'x',
            events: {
                selection: function(event) {
                    if (!event.xAxis) {
                      return;
                    }
                    chosenLabel = '自定义范围';
                    $scope.startDate = startDate = moment(event.xAxis[0].min);
                    $scope.endDate = endDate = moment(event.xAxis[0].max);
                    emitDateRangeChange($scope);
                }
            }
        },
        credits : {
            enabled : false
        },
        rangeSelector : {
            enabled : false
        },
        navigator : {
            enabled : false
        },
        scrollbar : {
            enabled : false
        },
        legend : {
            enabled : series.length > 1
        },
        series : series,
        tooltip: {
            valueDecimals: 0,
            dateTimeLabelFormats: {
              millisecond:"%Y-%m-%dT%H:%M:%S.%L",
              second:"%Y-%m-%dT%H:%M:%S.%L",
              minute:"%Y-%m-%dT%H:%M",
              hour:"%Y-%m-%dT%H:%M",
              day:"%Y-%m-%dT%H:%M",
              week:"Week from %A, %b %e, %Y",
              month:"%B %Y",
              year:"%Y"
            }
        },
        xAxis: {
          ordinal: false,
          minRange: 1000,
          dateTimeLabelFormats: {
            //millisecond: '%H:%M:%S.%L',
            millisecond: '%H:%M:%S',
            second: '%H:%M:%S',
            minute: '%H:%M',
            hour: '%H:%M',
            day: '%m.%e',
            week: '%e. %b',
            month: '%b \'%y',
            year: '%Y'
          }
        },
        yAxis : {
            floor : 0,
            gridLineColor: '#EEE'
        },
        plotOptions: {
            series: {
                marker: {
                    enabled: true
                }
            }
        }
    };

    if (opts) {
      opts = _.extend(defaultOpts, opts);
    } else {
      opts = defaultOpts;
    }

    if (opts.basicChart) {
      chart.highChart = new Highcharts.Chart(opts);
    } else {
      chart.highChart = new Highcharts.StockChart(opts);
    }
};

var handleSearchResult = function($scope, esResponse) {
  $scope.page.searchResult = esResponse;
  $scope.pageCount = Math.ceil(esResponse.hits.total/100);

  _.each(esResponse.hits.hits || [], function(hit) {
    if (hit.highlight) {
      hit.highlightMsg = hit.highlight.message && hit.highlight.message.length &&
          hit.highlight.message[0].replace(/>/g, '&gt;').replace(/</g, '&lt;')
          .replace(/\*%pre%\*/g, '<em>').replace(/\*%post%\*/g, '</em>');
    }
  });
};

var getESBody = function($scope) {
  return {
    query: $scope.page.query,
    size: 100,
    from: ($scope.currentPage - 1) * 100,
    sort: [{
      timestamp: {
        order: $scope.orderBy > 0 ? "asc" : "desc"
      }
    }],
    "highlight": {
      "pre_tags" : ["*%pre%*"],
      "post_tags" : ["*%post%*"],
      "fields": {
        "message": {
          "fragment_size": 1000
        }
      }
    }
  }
};

var baseFields = [{
  key: 'host',
  name: '主机',
  group: 'base'
}, {
  key: 'path',
  name: '路径',
  group: 'base'
}];

var nginxKeyMap = {
  'nginx.http_method': {
    name: 'http_method'
  },
  'nginx.referer': {
    name: 'referer',
    customizable: true
  },
  'nginx.remote_address': {
    name: 'remote_address'
  },
  'nginx.request_uri': {
    name: 'request_uri',
    customizable: true
  },
  'nginx.response_size': {
    name: 'response_size',
    isNumeric: true
  },
  'nginx.response_status': {
    name: 'response_status'
  },
  'nginx.user_agent': {
    name: 'user_agent'
  },
  'nginx.spider': {
    name: 'spider'
  }
};

var nginxFieldKeys = _.map(('remote_address,http_method,request_uri,response_status,response_size,' +
    'referer,user_agent,spider').split(','), function(name) {
  return 'nginx.' + name;
});

var intervals = [{
  title: '1分钟',
  ms: 1000 * 60
}, {
  title: '5分钟',
  ms: 1000 * 60 * 5
}, {
  title: '20分钟',
  ms: 1000 * 60 * 20
}, {
  title: '1小时',
  ms: 1000 * 3600
}, {
  title: '4小时',
  ms: 1000 * 3600 * 4
}, {
  title: '1天',
  ms: 1000 * 3600 * 24
}];

var getAvailableIntervals = function() {
  var result = _.chain(intervals).map(function(interval) {
    var points = (endDate - startDate) / interval.ms;
    if (points > 1 && points < 100) {
      return interval;
    }
    return null;
  }).filter().value().reverse();
  return result;
};

var setAutoInterval = function($scope) {
  var points = Math.min(30, parseInt((endDate - startDate) / 1000) + 1);
  $scope.interval = parseInt((endDate - startDate)/points);
  $scope.autoInterval = true;
};

var isStatsDeserialized = false;

angular.module('consoleApp', ['tableSort', 'ngSanitize'])
.filter('isEmpty', function () {
        return function (obj) {
            for (var bar in obj) {
                if (obj.hasOwnProperty(bar)) {
                    return false;
                }
            }
            return true;
        };
})
.filter('maxStr', function() {
  return function(str, len) {
    return (str && str.length > len) ?
      str.substr(0, len) + "..." :
      str;
  };
})
.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });
 
                event.preventDefault();
            }
        });
    };
})
.controller('Ctrl', ['$scope', '$http', '$location', '$timeout', function($scope, $http, $location, $timeout) {
    $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

    searchStats($scope, $http, $location).init();


    $scope.drawChart = drawChart;

    var locationSearch = $location.search();
    initDateRangePicker($scope, locationSearch)

    var chartCount = {
      id: 'chartCount'
    };

    var currentPage = (function() {
      var p = parseInt(locationSearch.p) || 1;
      if (p > 10 || p < 0) {
        p = 1;
      }
      return p;
    } ());

    // interval
    var i = parseInt(locationSearch.i);
    if (i) {
      $scope.interval = i;
    } else {
      setAutoInterval($scope);
    }

    var parseJsonStr = function(str) {
      try {
        return JSON.parse(str);
      } catch (e) {
        return {};
      }
    };

    _.extend($scope, {
      _: _,
      moment: moment,
      parseInt: parseInt,
      currentPage: currentPage,
      Math: Math,
      orderBy: parseInt(locationSearch.o) || 1,
      page: {
        showHostAndPath: 1,
        tab: locationSearch.t || 'detail',
        filter: {
          field: parseJsonStr(locationSearch.f),
          _field: parseJsonStr(locationSearch._f)
        },
        attributeAggs: 'avg',
        keywords: locationSearch.k || ''
      }
    });

    $scope.getFieldName = function(key) {
      var fieldMap = _.indexBy($scope.fields, 'key');
      return fieldMap[key] && fieldMap[key].name;
    }

    var parepareDynamicFields = function() {
      var query = {
        filtered: {
          query: null,
          filter: {
            and: [$scope.page.filter.timerange]
          }
        }
      };

      _.each($scope.page.filter.field, function(fieldValues, fieldKey) {
        if (!_.contains(['path', 'host'], fieldKey)) {
          return;
        }
        query.filtered.filter.and.push({
          or: _.map(fieldValues, function(fieldValue) {
            return {
              term: _.object([[fieldKey, fieldValue]])
            }
          })
          // term: _.object([[field, value]])
        });
      });

      $http.post("/console/ajax/search", {
        keywords: $scope.page.keywords || '',
        type: 'attributes',
        esBody: {
          query: query,
          aggs: {
            field_aggs: {
              terms: {
                field: "attribute"
              }
            }
          },
          size: 0
        },
        begin: +startDate,
        end: +endDate
      }).success(function(json) {
        var fields = json.aggregations && _.chain(json.aggregations.field_aggs.buckets).map(function(bucket) {
          var key = bucket.key;
          if (key.indexOf('_') === 0) {
            return null;
          }
          var group = key.indexOf('.') > 0 ? key.substr(0, key.indexOf('.')) : 'unknow';
          return _.extend({
            key: key,
            group: group
          }, nginxKeyMap[key]);
        }).filter().value();

        var oldFieldMap = _.indexBy($scope.fields || [], 'key');

        $scope.fields = _.clone(baseFields);
        _.each(fields, function(field) {
          var oldField = oldFieldMap[field.key];

          var newField = oldField || field;

          if (oldField && !oldField.name) {
            // 来自 _field 复制网址
            newField = _.extend(field, {
              input: oldField.input
            });
            $scope.toggleField(newField);
          }

          $scope.fields.push(newField);
        });

        $scope.stats.setFileds();
        $timeout(function() {
          if (!isStatsDeserialized) {
            $scope.stats.deserialize();
            isStatsDeserialized = true;
            $scope.stats.showStats();
          }
        }, 1000);
        
        $scope.fieldGroups = [{
          group: 'base',
          title: '按日志位置过滤',
          fields: baseFields
        }];

        var groupMap = _.groupBy($scope.fields, 'group');
        if (groupMap.nginx) {
          var fieldMap = _.indexBy(groupMap.nginx, 'key');
          $scope.fieldGroups.push({
            group: 'nginx',
            title: 'Nginx / Apache',
            fields: _.map(nginxFieldKeys, function(fieldKey) {
              return fieldMap[fieldKey];
            })
          });
        }

      });
    };

    $scope.search = function(opts) {
        // opts: init, intervalOnly
        opts = opts || {};

        if (opts.init) {
          // 第一次搜索
          $scope.availableIntervals = getAvailableIntervals();
        } else {
          // 不是第一次搜索(第一次根据url显示页码)，显示第一页
          $scope.currentPage = 1;
        }

        if (!opts.intervalOnly) {
          // 只更新间隔时间，不刷新 date range picker
          updateDateRangePicker($scope);
        }

        $location.search(_.extend($location.search(), {
          k: $scope.page.keywords || '',
          b: +startDate,
          e: +endDate,
          p: $scope.currentPage,
          o: $scope.orderBy,
          f: JSON.stringify($scope.page.filter.field),
          _f: JSON.stringify($scope.page.filter._field),
          i: $scope.interval
        }));
        
        $scope.page.pattern = pattern($scope.page.keywords);
        
        $scope.page.filter.timerange = {
          range: {
              timestamp: {
                from: startDate.toISOString(),
                to:  endDate.toISOString()
              }
          }
        };
        $scope.page.query = {
          filtered: {
            query: $scope.page.pattern.query,
            filter: {
              and: [$scope.page.filter.timerange]
            }
          }
        };

        // 增加 $scope.page.query.filtered.query
        if (opts.init) {
          // 增加 _field 过滤
          if (!$scope.fields) {
            $scope.fields = [];
          }
          var fieldMap = _.indexBy($scope.fields, 'key');
          _.each($scope.page.filter._field || {}, function(value, key) {
            if (fieldMap[key]) {
              fieldMap[key].input = value;
            } else {
              $scope.fields.push({
                key: key,
                input: value
              })
            }
          });
        }
        _.each($scope.fields, function(field) {
          if ($scope.page.query.filtered.query == null) {
            $scope.page.query.filtered.query = {
              bool: {
                must: []
              }
            }
          }

          if (field.input) {
            $scope.page.query.filtered.query.bool.must.push({
              match_phrase: _.object(["_" + field.key], [field.input])
            })
          }
        });

        if ($scope.page.query.filtered.query && $scope.page.query.filtered.query.bool.must.length === 0) {
          $scope.page.query.filtered.query = null;
        }

        // 增加 $scope.page.query.filtered.filter 
        _.each($scope.page.filter.field, function(fieldValues, fieldKey) {
          $scope.page.query.filtered.filter.and.push({
            or: _.map(fieldValues, function(fieldValue) {
              return {
                term: _.object([[fieldKey, fieldValue]])
              }
            })
            // term: _.object([[field, value]])
          });
        });
        _.each($scope.page.pattern.filters, function(filter) {
          $scope.page.query.filtered.filter.and.push(filter);
        });

        if (chartCount.highChart) {
            chartCount.highChart.showLoading();
        }

        if (!opts.intervalOnly) {
          //  不仅更新间隔时间
          parepareDynamicFields();
          _.each($scope.fields, refreshFieldInfo);
        }

        // 更新统计
        if (!opts.init) {
          $scope.stats.showStats();
        }

        // 主要搜索
        $http.post("/console/ajax/search", {
          keywords: $scope.page.keywords || '',
          esBody: _.extend(getESBody($scope), {
            aggs: {
              event_over_time: {
                date_histogram: {
                  field: "timestamp",
                  interval: $scope.interval + "ms"
                }
              }
            }
          }),
          begin: +startDate,
          end: +endDate
        }).success(function(json) {
          handleSearchResult($scope, json);
          var buckets = json.aggregations ? json.aggregations.event_over_time.buckets : [];
          var data = [];
          if (buckets.length === 0) {
            for (var date = +startDate; date <= +endDate; date += $scope.interval) {
              data.push([date, 0]);
            }
          } else {
            var add = (buckets[0].key - startDate) % $scope.interval;
            var minus = (endDate - buckets[0].key) % $scope.interval;
            var from = startDate + add;
            var to = endDate - minus;

            if (from < buckets[0].key) {
              data.push([from, 0]);
            }
            _.each(buckets, function(bucket) {
              data.push([bucket.key, bucket.doc_count]);
            });
            if (buckets.length>1 && to > buckets[buckets.length-1].key) {
              data.push([to, 0]);
            }
          }

          var series = [{
            name: '数量',
            type: 'column',
            data: data
          }];
          $scope.drawChart(chartCount, series);

        }); // end success
    }

    var refreshFieldInfo = function(field) {
      if (!field.show) {
        field.buckets = null;
        return;
      }

      field.loading = true;

      var query = {
        filtered: {
          query: $scope.page.query.filtered.query,
          // query: $scope.page.pattern.query,
          filter: {
            and: [$scope.page.filter.timerange]
          }
        }
      };

      // TODO: pattern.filter 清理
      _.each($scope.page.pattern.filters, function(filter) {
        query.filtered.filter.and.push(filter);
      });
      
      _.each($scope.page.filter.field, function(fieldValues, fieldKey) {
        if (fieldKey === field.key) {
          return;
        }
        query.filtered.filter.and.push({
          or: _.map(fieldValues, function(fieldValue) {
            return {
              term: _.object([[fieldKey, fieldValue]])
            }
          })
        });
      });

      $http.post("/console/ajax/search", {
        keywords: $scope.page.keywords || '',
        esBody: {
          query: query,
          size: 0,
          aggs: {
            group_by_field: {
              terms: {
                field: field.key,
                size: 300
              }
            }
          }
        },
        begin: +startDate,
        end: +endDate
      }).success(function(json) {
        field.loading = false;
        field.buckets = json.aggregations ?
          json.aggregations.group_by_field.buckets :
          [];
        field.total = field.buckets.length;

        // 查看 attributes 总数
        if (field.total >= 300) {
          field.total = 'loading';
          $http.post("/console/ajax/search", {
            keywords: $scope.page.keywords || '',
            esBody: {
              query: query,
              size: 0,
              aggs: {
                unique_attributes_count: {
                  cardinality: {
                    field: field.key
                  }
                }
              }
            },
            begin: +startDate,
            end: +endDate
          }).success(function(json) {
            field.total = json.aggregations.unique_attributes_count.value;
          });
        }

        // 如果已经选中，虽然没有数据，也会显示数量位0
        var fieldValues = $scope.page.filter.field[field.key];
        if (fieldValues) {
          var fieldBucketKeys = _.map(field.buckets, function(bucket) {
            return bucket.key;
          });
          _.each(fieldValues, function(fieldValue) {
            if (!_.contains(fieldBucketKeys, fieldValue)) {
              field.buckets.push({
                key: fieldValue,
                doc_count: 0
              });
            }
          });
        }
      });
    };

    $scope.toggleField = function(field) {
      field.show = !field.show;
      refreshFieldInfo(field);
    };

    /*
    * 设置某个 filter field，包含增加 field 和移除 field
    * field: {key, name}
    * bucket: {key, doc_count}
    */
    $scope.filterField = function(field, bucket) {
      // fieldValues: [value1, value2, value3]
      var fieldValues = $scope.page.filter.field[field.key] || [];
      if (_.contains(fieldValues, bucket.key)) {
        // 移除 field
        fieldValues = _.without(fieldValues, bucket.key);
        if (fieldValues.length) {
          $scope.page.filter.field[field.key] = fieldValues;
        } else {
          delete $scope.page.filter.field[field.key]
        }
      } else {
        // 增加 field
        fieldValues.push(bucket.key);
        $scope.page.filter.field[field.key] = fieldValues;
      }
      $scope.search();
    };

    // 自定义field: key, name, input
    $scope.searchCustomField = function(field) {
      if (!field.input) {
        $scope.removeCustomField(field.key);
      } else {
        $scope.page.filter._field[field.key] = field.input;
      }
      $scope.search();
    };

    // 删除用户填写的 field 条件
    $scope.removeCustomField = function(fieldKey) {
      _.some($scope.fields, function(field) {
        if (field.key == fieldKey) {
          field.input = '';
          return true;
        }
      });
      delete $scope.page.filter._field[fieldKey];
      $scope.search();
    };

    // 删除某个 field 的全部
    $scope.removeFieldFilter = function(key) {
      // field.key, bucket.key
      delete $scope.page.filter.field[key];
      $scope.search();
    }
    $scope.showFieldKeys = function(field) {
      $scope.modalFieldData = {
        field: field,
        buckets: field.buckets
      }
      $('#modalAllFieldKeys').modal();
    }
    $scope.search({
      init: 1
    });

    var refreshResult = function(callback) {
      $http.post("/console/ajax/search", {
          keywords: $scope.page.keywords || '',
          esBody: getESBody($scope),
          begin: startDate,
          end: endDate
      }).success(function(json) {
        handleSearchResult($scope, json);
        callback();
      })
    };

    $scope.toPage = function(page) {
      if ($scope.currentPage == page) {
        return;
      }
      $scrollTo('#resultList', 500);
      $scope.currentPage = page;
      $location.search('p', page);
      
      con.wait();
      refreshResult(function() {
        con.done();
      });
    };

    $scope.toggleOrderBy = function() {
      $scope.orderBy = -$scope.orderBy;
      $scope.currentPage = 1;
      $location.search('p', 1);
      $location.search('o', $scope.orderBy);

      con.wait();
      refreshResult(function() {
        con.done();
      });
    }

    $scope.changeInterval = function(interval) {
      if (interval === 'auto') {
        setAutoInterval($scope);
      } else {
        $scope.interval = interval;
        $scope.autoInterval = false;
      }
      $scope.search({
        intervalOnly: 1
      });
    };

    $scope.changeTab = function(tab) {
      $location.search('t', tab);
      $scope.page.tab = tab;
      $scope.stats.showStats();
    }
}]); // end angular

$(function() {
  $('[data-rel=tooltip]').tooltip({container: 'body'});
  angular.bootstrap(document, ['consoleApp']);
});

}); // end require ['jquery', ...]
