
/* jshint ignore:start */

(function() {
  define(['underscore'], function(_) {
    return function($scope) {
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
        changeChartType: function() {},
        changeField: function() {
          this.aggs = [];
          if (this.selectedField) {
            this.aggs.push({
              title: '唯一值数量'
            });
            if (this.selectedField.isNumeric) {
              return this.aggs = this.aggs.concat([
                {
                  title: '求和'
                }, {
                  title: '最大值'
                }, {
                  title: '最小值'
                }
              ]);
            }
          }
        },
        changeAgg: function() {
          var field, _i, _len, _ref, _results;
          this.groups = [];
          if (this.selectedAgg) {
            _ref = this.fields;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              field = _ref[_i];
              if (field.key !== this.selectedField.key && !field.isNumeric) {
                _results.push(this.groups.push(field));
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          }
        },
        changeGroup: function() {}
      };
      $stats.selectedChartType = $stats.chartTypes[0];
      if ($stats.selectedField) {
        $stats.aggs.push({
          title: '唯一值数量'
        });
        if ($stats.selectedField.isNumeric) {
          return $stats.aggs.concat([
            {
              title: '求和'
            }, {
              title: '最大值'
            }, {
              title: '最小值'
            }
          ]);
        }
      }
    };
  });

}).call(this);
