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
        bucket.metric_value?.value || bucket.doc_count  # 没有选取 field 时无 metric_value
      ]
      return

    if buckets.length > 1 and to > buckets[buckets.length - 1].key
      data.push [
        to
        0
      ]

  return data


chartStats = {id: 'chartStats'}

defaultAgg = {
  value: 'value_count'
  title: '数量'
}

define ['underscore'], (_) ->
  ($scope, $http, $location) ->
    $scope.stats =
      init: () ->
        @chartTypes = [{
          value: 'line'
          text: '折线图'
        }, {
          value: 'bar'
          text: '柱状图'
        }]
        @aggs = [defaultAgg]
        @groups = []
        @selectedChartType = @chartTypes[0]
        @selectedAgg = @aggs[0]
        @type = 'event_count'

      serialize: () ->
        JSON.stringify
          chartType: @selectedChartType?.value
          field: @selectedField?.key
          agg: @selectedAgg?.value
          group: @selectedGroup?.key

      deserialize: () ->
        str = $location.search().stats
        try
          selected = JSON.parse(str)
          for chartType in @chartTypes
            if chartType.value == selected.chartType
              @selectedChartType = chartType
              break;
          for field in @fields
            if field.key == selected.field
              @selectedField = field
              break;
          for agg in @aggs
            if agg.value == selected.agg
              @selectedAgg = agg
              break;
          for group in @groups
            if group.key == selected.group
              @selectedGroup = group
              break;
        catch e

      setFileds: () ->
        @fields = $scope.fields
        @selectedField = @fields[0]
        @setGroups()

      setAggs: () ->
        newAggs = [{
          value: 'terms'
          title: '数量'
        }]
        if @selectedField
          if @selectedField.isNumeric
            newAggs = [defaultAgg].concat [{
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
            newAggs = [defaultAgg].concat [{
              value: 'cardinality'
              title: '唯一值数量'
            }]

        if newAggs.length != @aggs.length
          @aggs = newAggs
          @selectedAgg = @aggs[0]

      setGroups: () ->
        @groups = []
        # if @selectedField
        for field in @fields
          if field.key != @selectedField?.key and !field.isNumeric
            @groups.push field
        if @selectedGroup?.key == @selectedField?.key
          @selectedGroup = ''

      optionsChange: () ->
        # groups 逻辑
        @setGroups()

        # aggs 逻辑
        @setAggs()

        # 显示图表
        @showStats()   

      showStats: () ->
        return if $scope.page.tab != 'stats'

        $location.search 'stats', @serialize()

        if chartStats.highChart
          chartStats.highChart.showLoading()

        #########
        date_histogram = null
        group_by_field = null
        aggregation = null 
        #########

        ## most bottom metric, e.g. avg, sum, event_count ...
        if @type == 'event_count'
          aggregation = 
            metric_value: 
              value_count:  { }
        else
          agg_method = @selectedAgg.value
          aggregation = 
            metric_value: {}
          aggregation.metric_value[@selectedAgg.value] = 
            field: @selectedField.key
              

        ## split by time interval
        if @selectedChartType.value == 'line'
          aggregation =
            event_over_time:
              date_histogram:
                field: 'timestamp',
                interval: $scope.interval + "ms"
              aggs: aggregation

        ## group by field
        if @selectedGroup
          aggregation =
            group_info:
              terms :
                field : @selectedGroup.key
                size: 10
              aggs : aggregation

        esBody =
          query: $scope.page.query
          size: 0
          aggs: aggregation

        title = (if @selectedField then @selectedField.name + " " else "") + @selectedAgg.title
        $http.post "/console/ajax/search",
          esBody: esBody
          begin: +$scope.startDate
          end: +$scope.endDate
        .success (json) =>
          chartHeight = 0
          if @selectedChartType.value == 'line'
            if @selectedGroup
              chartHeight = 350
            else 
              chartHeight = 300
          else if @selectedChartType.value == 'bar'
            if @selectedGroup
              buckets = json.aggregations.group_info.buckets
              chartHeight = 60 + buckets.length * 35
            else
              chartHeight = 100

          $('#chartStats').height(chartHeight);

          if @selectedChartType.value == 'line'
            if @selectedGroup  
              series = _.chain(json.aggregations.group_info.buckets).map (bucket) ->
                data = getTimeData(bucket, $scope)
                return {
                  name: bucket.key,
                  type: 'line'
                  data: data
                }
              .value()[0..4]

              $scope.drawChart chartStats, series,
                title:
                  text: title
            else
              data = getTimeData(json.aggregations, $scope)
              series = [{
                name: title
                type: 'line'
                data: data
              }]
              $scope.drawChart(chartStats, series)
          else if @selectedChartType.value == 'bar'
            buckets = json.aggregations.group_info.buckets
            if @selectedGroup
              data = (bucket.metric_value?.value || bucket.doc_count) for bucket in buckets
              categories = (bucket.key for bucket in buckets)
            else
              data = [json.aggregations.metric_value.value]
              categories = ['全部']

            $scope.drawChart chartStats, [{
              name: title
              data: data
              type: 'bar'
            }],
              basicChart: 1
              chart:
                renderTo : chartStats.id
              plotOptions:
                bar:
                  dataLabels:
                    enabled: true
              title:
                text: title
              xAxis:
                categories: categories
                title:
                  text: null
              yAxis:
                floor : 0
                title:
                  text: null
                min: 0
                labels:
                  overflow: 'justify'            

    