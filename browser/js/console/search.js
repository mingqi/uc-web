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
      chosenLabel = picker.chosenLabel;
      startDate = picker.startDate;
      endDate = picker.endDate;
      $scope.search();
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
    chart.highChart = new Highcharts.StockChart(opts);
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
  name: '主机'
}, {
  key: 'path',
  name: '路径'
}];

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
      orderBy: parseInt(locationSearch.o) || 1,
      page: {
        showHostAndPath: 1,
        filter: {
          field: (function() {
            try {
              return JSON.parse(locationSearch.f);
            } catch (e) {
              return {};
            }
          }).call(this)
        },
        attributeAggs: 'avg',
        keywords: locationSearch.k || ''
      },
      chartCount: {
        id: 'chartCount'
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
        var fields = _.chain(json.aggregations.field_aggs.buckets).map(function(bucket) {
          if (bucket.key.indexOf('_') === 0) {
            return null;
          }
          return {
            key: bucket.key,
            name: bucket.key
          }
        }).filter().value();

        var oldFieldMap = _.indexBy($scope.fields || [], 'key');

        $scope.fields = _.clone(baseFields);
        _.each(fields, function(field) {
          var oldField = oldFieldMap[field.key];

          $scope.fields.push(oldField || field);
        });

      });
    };

    $scope.search = function(opts) {
        // opts: init
        opts = opts || {};

        if (!opts.init) {
          // 不是第一次搜索(第一次根据url显示页码)，显示第一页
          $scope.currentPage = 1;
        }

        updateDateRangePicker($scope);

        _.extend($scope.chartCount, {
            begin: startDate,
            end: endDate
        });

        $location.search({
          k: $scope.page.keywords || '',
          b: +startDate,
          e: +endDate,
          p: $scope.currentPage,
          o: $scope.orderBy,
          f: JSON.stringify($scope.page.filter.field)
        });
        
        $scope.page.pattern = pattern($scope.page.keywords);

        var points = Math.min(30, parseInt((endDate - startDate) / 1000) + 1);
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

        if ($scope.chartCount.highChart) {
            $scope.chartCount.highChart.showLoading();
        }

        parepareDynamicFields();

        // 主要搜索
        $http.post("/console/ajax/search", {
          keywords: $scope.page.keywords || '',
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

        }); // end success

        _.each($scope.fields, refreshFieldInfo);
    }

    var refreshFieldInfo = function(field) {
      if (!field.show) {
        field.buckets = null;
        return;
      }

      field.loading = true;
      var query = {
        filtered: {
          query: $scope.page.pattern.query,
          filter: {
            and: [$scope.page.filter.timerange]
          }
        }
      };
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
      // fields: [value1, value2, value3]
      var fields = $scope.page.filter.field[field.key] || [];
      if (_.contains(fields, bucket.key)) {
        // 移除 field
        fields = _.without(fields, bucket.key);
        if (fields.length) {
          $scope.page.filter.field[field.key] = fields;
        } else {
          delete $scope.page.filter.field[field.key]
        }
      } else {
        // 增加 field
        fields.push(bucket.key);
        $scope.page.filter.field[field.key] = fields;
      }
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
}]); // end angular

$(function() {
  $('[data-rel=tooltip]').tooltip({container: 'body'});
  angular.bootstrap(document, ['consoleApp']);
});

}); // end require ['jquery', ...]
