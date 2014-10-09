require(['jquery', 'underscore', 'con', 'moment', 'scrollTo', 'pattern',
         'highstock', 'daterangepicker', 'pattern', 'angular-sanitize'],
function($, _, con, moment, $scrollTo, pattern) {

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
var startDate, endDate, autoRefreshTimer;
var getRanges = function() {
  var ranges = {
     '过去1小时': [moment().subtract(1, 'hour'), moment()],
     '过去6小时': [moment().subtract(6, 'hour'), moment()],
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
var isCustomerRange = function() {
    // return chosenLabel.indexOf('过去') === -1;
    return !_.include(['过去1小时', '过去6小时'], chosenLabel);
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

  $('#daterange').daterangepicker(dateRangePickerOptions);
  $('#daterange').on('apply.daterangepicker', function(ev, picker) {
      var isCustRangeBefore = isCustomerRange();
      chosenLabel = picker.chosenLabel;
      if (isCustRangeBefore && !isCustomerRange()) {
          // customer -> (not customer)
          $scope.autoRefresh = true;
      }

      startDate = picker.startDate;
      endDate = picker.endDate;
      $scope.search();
  });
};

var updateDateRangePicker = function($scope) {
  var ranges = getRanges();
  $scope.dateRange = startDate.format(dateFormat) + " 到 " + endDate.format(dateFormat);

  var opts = _.extend(dateRangePickerOptions, {
    ranges: ranges,
    startDate: startDate,
    endDate: endDate,
    minDate: moment().subtract(15, 'day'),
    maxDate: moment(),
  });
  $('#daterange').data('daterangepicker').setOptions(opts);
};

var drawChart = function(chart, series, $scope) {
    if (chart.highChart) {
        chart.highChart.destroy();
    }
    var opts = {
        chart : {
            renderTo : chart.id,
            zoomType : 'x',
            events: {
                selection: function(event) {
                    if (!event.xAxis) {
                      return;
                    }
                    chosenLabel = '自定义范围';
                    startDate = moment(event.xAxis[0].min);
                    endDate = moment(event.xAxis[0].max);
                    $scope.search();
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
            millisecond: '%H:%M:%S.%L',
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
    chart.highChart = new Highcharts.StockChart(opts);
};

var setAutoRefresh = function($scope) {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
    }
    autoRefreshTimer = setInterval(function() {
        if (!$scope.autoRefresh) {
            return;
        }

        $scope.search();
    }, 1000 * 60);
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
    sort: ['timestamp'],
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
.controller('Ctrl', ['$scope', '$http', '$location', function($scope, $http, $location) {
    $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

    var locationSearch = $location.search();
    initDateRangePicker($scope, locationSearch)

    var currentPage = (function() {
      var p = parseInt(locationSearch.p) || 1;
      if (p > 10 || p < 0) {
        p = 1;
      }
      return p;
    } ());

    _.extend($scope, {
      _: _,
      moment: moment,
      parseInt: parseInt,
      currentPage: currentPage,
      Math: Math,
      autoRefresh: true,
      page: {
        filter: {
          field: {}
        },
        attributeAggs: 'avg',
        keywords: locationSearch.k || ''
      },
      fields: [{
        key: 'host',
        name: '主机名称'
      }, {
        key: 'path',
        name: '路径'
      }],
      chartCount: {
        id: 'chartCount'
      }
    });

    $scope.search = function(opts) {
        // opts: reserve, init
        opts = opts || {};

        if (!opts.init) {
          // 不是第一次搜索(第一次根据url显示页码)，显示第一页
          $scope.currentPage = 1;
        }

        updateDateRangePicker($scope);

        if (isCustomerRange()) {
          $scope.autoRefresh = false;
        }

        _.extend($scope.chartCount, {
            begin: startDate,
            end: endDate
        });

        $location.search({
          k: $scope.page.keywords || '',
          b: +startDate,
          e: +endDate,
          p: $scope.currentPage,
        });
        
        $scope.page.pattern = pattern($scope.page.keywords);

        var points = 30;
        var interval = $scope.interval = parseInt((endDate - startDate)/points);
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
        _.each($scope.page.filter.field, function(value, field) {
          $scope.page.query.filtered.filter.and.push({
            term: _.object([[field, value]])
          });
        });
        _.each($scope.page.pattern.filters, function(filter) {
          $scope.page.query.filtered.filter.and.push(filter);
        });

        if ($scope.chartCount.highChart) {
            $scope.chartCount.highChart.showLoading();
        }

        $http.post("/console/ajax/search", {
          esBody: _.extend(getESBody($scope), {
            aggs: {
              event_over_time: {
                date_histogram: {
                  field: "timestamp",
                  interval: interval + "ms"
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
            for (var date = +startDate; date <= +endDate; date += interval) {
              data.push([date, 0]);
            }
          } else {
            var add = (buckets[0].key - startDate) % interval;
            var minus = (endDate - buckets[0].key) % interval;
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
          drawChart($scope.chartCount, series, $scope);

          setAutoRefresh($scope);
          
          if (!opts.reserve) {
              _.map($scope.fields, function(field) {
                _.extend(field, {
                  show: false,
                  buckets: null
                });
              });
          }
        })
    }

    $scope.toggleAutoRefresh = function() {
        if (!isCustomerRange()) {
            $scope.autoRefresh = !$scope.autoRefresh    
        }
    };

    $scope.toggleField = function(field) {
      if (!field.buckets) {
        field.loading = true;
        $http.post("/console/ajax/search", {
          esBody: {
            query: $scope.page.query,
            size: 0,
            aggs: {
              unique_number_for_attributes: {
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
            json.aggregations.unique_number_for_attributes.buckets :
            [];
        });
      }
      field.show = !field.show;
    };

    $scope.filterField = function(field, bucket) {
      // field.key, bucket.key
      $scope.page.filter.field[field.key] = bucket.key;
      $scope.search({reserve:true});
    }
    $scope.removeFieldFilter = function(key) {
      // field.key, bucket.key
      delete $scope.page.filter.field[key]
      $scope.search({reserve:true});
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

    $scope.toPage = function(page) {
      if ($scope.currentPage == page) {
        return;
      }
      $location.search('p', page);

      $http.post("/console/ajax/search", {
          esBody: _.extend(getESBody($scope), {
            from: (page - 1) * 100
          }),
          begin: startDate,
          end: endDate
      }).success(function(json) {
          handleSearchResult($scope, json);
          $scope.currentPage = page;
          $scrollTo('#resultList', 500);
      })

    }
}]); // end angular

$(function() {
  $('[data-rel=tooltip]').tooltip({container: 'body'});
  angular.bootstrap(document, ['consoleApp']);
});

}); // end require ['jquery', ...]
