### jshint ignore:start ###

getTimeData = (timeAgg, $scope) ->
  [startDate, endDate] = [$scope.startDate, $scope.endDate]
  buckets = timeAgg?.event_over_time.buckets || []

  data = []
  if buckets.length is 0
    date = +startDate

    while date <= +endDate
      data.push [
        date
        0
      ]
      date += $scope.interval
  else
    add = (buckets[0].key - startDate) % $scope.interval
    minus = (endDate - buckets[0].key) % $scope.interval
    from = startDate + add
    to = endDate - minus
    if from < buckets[0].key
      data.push [
        from
        0
      ]
    _.each buckets, (bucket) ->
      data.push [
        bucket.key
        bucket.metric_value.value
      ]
      return

    if buckets.length > 1 and to > buckets[buckets.length - 1].key
      data.push [
        to
        0
      ]

  return data


chartStats = {id: 'chartStats'}

define ['underscore', 'scrollTo'], (_, $scrollTo) ->
  ($scope, $http) ->
    $scope.stats =
      init: () ->
        @chartTypes = [{
          value: 'line'
          text: '折线图'
        }, {
          value: 'bar'
          text: '柱状图'
        }]
        @aggs = []
        @groups = []
        @selectedChartType = @chartTypes[0]

      setFileds: () ->
        @fields = $scope.fields

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

          if chartStats.highChart
            chartStats.highChart.showLoading();

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
              .success (json) =>
                # 分组、时间、统计

                series = _.chain(json.aggregations.group_info.buckets).map (bucket) =>
                  data = getTimeData(bucket, $scope)
                  return {
                    name: bucket.key + " " + @selectedField.name + " " + @selectedAgg.title,
                    type: 'line'
                    data: data
                  }
                .value()[0..3]

                $scope.drawChart(chartStats, series)

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
                # 分组、统计

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
              .success (json) =>
                # 时间、统计
                data = getTimeData(json.aggregations, $scope)
                series = [{
                  name: @selectedField.name + " " + @selectedAgg.title
                  type: 'line'
                  data: data
                }]
                $scope.drawChart(chartStats, series)

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
                # 统计
                

    