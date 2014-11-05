### jshint ignore:start ###


define ['underscore', 'scrollTo'], (_, $scrollTo) ->
  ($scope, $http) ->
    $stats = $scope.stats =
      chartTypes: [{
        value: 'line'
        text: '折线图'
      }, {
        value: 'bar'
        text: '柱状图'
      }]
      fields: $scope.fields
      aggs: []
      groups: []

      changeChartType: () ->
        # alert(@selectedChartType.value)
        @showStats()

      changeField: () ->
        @aggs = []

        if @selectedField
          if @selectedField.isNumeric
            @aggs = [{
              value: 'avg'
              title: '平均'
            }, {
              value: 'sum'
              title: '求和'
            }, {
              value: 'max'
              title: '最大值'
            }, {
              value: 'min'
              title: '最小值'
            }]
          else
            @aggs = [{
              value: 'cardinality'
              title: '唯一值数量'
            }]

        @selectedAgg = null

      changeAgg: () ->
        # alert(@selectedAgg)
        @groups = []
        if @selectedAgg
          for field in @fields
            if field.key != @selectedField.key and !field.isNumeric
              @groups.push field
        @selectedGroup = ''
        @showStats()

      changeGroup: () ->
        # alert(@selectedGroup)
        @showStats()

      showStats: () ->
        if @selectedField && @selectedAgg

          metricValue = _.object [@selectedAgg.value], [{field: @selectedField.key}]

          if @selectedGroup
            if @selectedChartType.value == 'line'
              $http.post "/console/ajax/search",
                esBody:
                  query: $scope.page.query
                  size: 0
                  aggs:
                    group_info:
                      terms:
                        field: @selectedGroup.key
                        size: 10
                      aggs:
                        event_over_time:
                          date_histogram:
                            field: "timestamp",
                            interval: $scope.interval + "ms"
                          aggs:
                            metric_value: metricValue
                begin: +$scope.startDate
                end: +$scope.endDate
              .success (json) ->

            else
              $http.post "/console/ajax/search",
                esBody:
                  query: $scope.page.query
                  size: 0
                  aggs:
                    group_info:
                      terms:
                        field: @selectedGroup.key
                        size: 10
                      aggs:
                        metric_value: metricValue

                begin: +$scope.startDate
                end: +$scope.endDate
              .success (json) ->

          else

            if @selectedChartType.value == 'line'
              $http.post "/console/ajax/search",
                esBody:
                  query: $scope.page.query
                  size: 0
                  aggs:
                    event_over_time:
                      date_histogram:
                        field: "timestamp",
                        interval: $scope.interval + "ms"
                      aggs:
                        metric_value: metricValue
                begin: +$scope.startDate
                end: +$scope.endDate
              .success (json) ->

            else
              $http.post "/console/ajax/search",
                esBody:
                  query: $scope.page.query
                  size: 0
                  aggs:
                    metric_value: metricValue

                begin: +$scope.startDate
                end: +$scope.endDate
              .success (json) ->

    $stats.selectedChartType = $stats.chartTypes[0]

    