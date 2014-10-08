require(['jquery', 'underscore', 'con', 'moment', 'scrollTo', 'pattern',
         'highstock', 'daterangepicker', 'pattern', 'angular-sanitize'],
function($, _, con, moment, $scrollTo, pattern) {

var chosenLabel = '过去1小时';
var dateFormat = 'YYYY-MM-DD HH:mm:ss';
var datePickerOpts;

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

var drawChart = function(chart, series) {
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
                    var format = '%Y-%m-%d %H:%M:%S';
                    var begin = Highcharts.dateFormat(format, event.xAxis[0].min);
                    var end = Highcharts.dateFormat(format, event.xAxis[0].max);
                    if (begin === end) {
                      end = Highcharts.dateFormat(format, event.xAxis[0].min + 1000);
                    }
                    chosenLabel = '自定义范围';
                    $('#daterange').val(begin + ' 到 ' + end);
                    $('#daterange').trigger('change');
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

var isCustomerRange = function(label) {
    label = label || chosenLabel;
    return !_.include(['过去1小时', '过去6小时'], label);
};

var getDatePickerOpts = function() {
    var ranges = {
       '过去1小时': [moment().subtract(1, 'hour'), moment()],
       '过去6小时': [moment().subtract(6, 'hour'), moment()],
       '昨天': [moment().subtract(1, 'day').startOf('day'), moment().subtract(1, 'day').endOf('day')],
       '过去1天': [moment().subtract(1, 'day'), moment()],
       '过去1周': [moment().subtract(1, 'week'), moment()],
       '过去15天': [moment().subtract(15, 'day'), moment()]
       //'过去2月': [moment().subtract(2, 'month'), moment()]
    };
    var result = {
        opens: 'left',
        timePicker: true,
        timePicker12Hour: false,
        timePickerIncrement: 15,
        ranges: ranges,
        format: dateFormat,
        minDate: moment().subtract(15, 'day'),
        // minDate: moment().subtract(60, 'day'),
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
        }
    };

    if (isCustomerRange()) {
        // start & end isn't change
        var picker = $('#daterange').data('daterangepicker');
        return _.extend(result, {
            startDate: picker.startDate,
            endDate: picker.endDate
        });
    }
    
    return _.extend(result, {
        startDate: ranges[chosenLabel][0],
        endDate: ranges[chosenLabel][1]
    });
};

var setDateRange = function() {
    $('#daterange').val(moment(datePickerOpts.startDate).format(dateFormat) + " 到 " +
            moment(datePickerOpts.endDate).format(dateFormat));
};

var setAutoRefresh = function() {
    if (window.refreshTimer) {
        clearInterval(window.refreshTimer);
    }
    window.refreshTimer = setInterval(function() {
        var $scope = angular.element($("body")).scope();
        if (!$scope.autoRefresh) {
            return;
        }

        datePickerOpts = getDatePickerOpts();
        $('#daterange').data('daterangepicker').setOptions(datePickerOpts);
        setDateRange();
        $('#daterange').trigger('apply.daterangepicker', $('#daterange').data('daterangepicker'));
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
    $scope.dateRange = $('#daterange').val();
    _.extend($scope, {
      _: _,
      moment: moment,
      parseInt: parseInt,
      Math: Math,
      currentPage: 1
    })
    $scope.page = {
      filter: {
        field: {}
      },
      attributeAggs: 'avg',
      keywords: ''
    };
    $scope.fields = [{
      key: 'host',
      name: '主机名称'
    }, {
      key: 'path',
      name: '路径'
    }];
    $scope.autoRefresh = true;
    $scope.chartCount = {
      id: 'chartCount'
    };
    $scope.chartStat = {
      id: 'chartStat'
    }

    $scope.search = function(opts) {
        // opts: reserve, init
        opts = opts || {};

        if (opts.init) {
          var locationSearch = $location.search();
          $scope.currentPage = locationSearch.p || 1;
          $scope.page.keywords = locationSearch.k || '';
          if (locationSearch.b && locationSearch.e) {
            var b = moment(parseFloat(locationSearch.b));
            var e = moment(parseFloat(locationSearch.e));
            if (b.isValid() && e.isValid() && 
                b.isBefore(e) &&
                moment().subtract(20, 'day').isBefore(b) &&
                moment().add(1, 'day').isAfter(e)) {
              $scope.dateRange = (b.format(dateFormat) + " 到 " + e.format(dateFormat));
            }
          }
        } else {
          $scope.currentPage = 1;          
        }

        if (isCustomerRange()) {
          $scope.autoRefresh = false;
        }
        if (!$scope.dateRange.match(/^(.+) 到 (.+)$/)) {
            return alert("时间格式错误")
        }
        var strBegin = RegExp.$1;
        var strEnd = RegExp.$2;
        var begin = $scope.begin = +moment(strBegin, dateFormat);
        var end = $scope.end = +moment(strEnd, dateFormat);


        _.extend($scope.chartCount, {
            begin: begin,
            end: end
        });

        $location.search('k', $scope.page.keywords || '');
        $location.search('b', begin);
        $location.search('e', end);

        $scope.page.pattern = pattern($scope.page.keywords);

        var points = 30;
        var interval = $scope.interval = parseInt((end-begin)/points);
        $scope.page.filter.timerange = {
          range: {
                timestamp: {
                  from: moment(begin).toISOString(),
                  to:  moment(end).toISOString()
                }
          }
        }
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
          begin: begin,
          end: end
        }).success(function(json) {
          handleSearchResult($scope, json);
          
          var buckets = json.aggregations ? json.aggregations.event_over_time.buckets : [];
          var data = [];
          if (buckets.length === 0) {
            for (var date = begin; date <= end; date += interval) {
              data.push([date, 0]);
            }
          } else {
            var add = (buckets[0].key - begin) % interval;
            var minus = (end - buckets[0].key) % interval;
            var from = begin + add;
            var to = end - minus;

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
          drawChart($scope.chartCount, series);
          setAutoRefresh();
          
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
          begin: $scope.begin,
          end: $scope.end
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
          begin: $scope.begin,
          end: $scope.end
      }).success(function(json) {
          handleSearchResult($scope, json);
          $scope.currentPage = page;
          $scrollTo('#resultList', 500);
      })

    }
}]); // end angular

$(function() {
  $('[data-rel=tooltip]').tooltip({container: 'body'});
  datePickerOpts = getDatePickerOpts();
  setDateRange();

  angular.bootstrap(document, ['consoleApp']);

  $('#daterange').daterangepicker(datePickerOpts);
  $('#daterange').on('apply.daterangepicker', function(ev, picker) {
      if (isCustomerRange() && !isCustomerRange(picker.chosenLabel)) {
          // customer -> (not customer)
          var $scope = angular.element($("body")).scope();
          $scope.autoRefresh = true;
      }
      chosenLabel = picker.chosenLabel;
      $('#daterange').trigger('change');
  });
});

}); // end require ['jquery', ...]
