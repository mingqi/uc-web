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
        },{
          value: 'pie'
          text: '饼图'
          }]
        @aggs = []
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
        if @selectedField
          if @selectedField.isNumeric
            newAggs = [].concat [{
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
            newAggs = [].concat [{
              value: 'cardinality'
              title: '不重复数量'
            }]

        if newAggs.length != @aggs.length
          @aggs = newAggs
          @selectedAgg = @aggs[0]

      setGroups: () ->
        @groups = []
        # if @selectedField
        for field in @fields
          if field.isNumeric
            continue
          if @type != 'event_count' and field.key == @selectedField?.key 
            continue
          @groups.push field

        if @type != 'event_count'
          if @selectedGroup?.key == @selectedField?.key
            @selectedGroup = ''

      chartTypeChange : (type) ->
        console.log("aaaaa = #{type}")
        @selectedChartType = type
        @optionsChange() 

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

        if chartStats.highChart?
          chartStats.highChart.showLoading()

        aggregation = null 

        ## most bottom metric, e.g. avg, sum, event_count ...
        if @type == 'event_count'
          aggregation = {}
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


        ### chart title ###
        title =  ''
        if @type == 'event_count'
          title = '日志数量'
        else
          if @selectedField
            title += @selectedField.name
          if @selectedAgg
            title += ' - ' + @selectedAgg.title

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
          else if @selectedChartType.value == 'pie'
            chartHeight = 300

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
              .value()

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
              $scope.drawChart chartStats, series,
                title:
                  text: title
          else if @selectedChartType.value == 'bar'
            if @type == 'event_count'
              if @selectedGroup
                buckets = json.aggregations.group_info.buckets
                data = (bucket.doc_count for bucket in buckets)
                categories = (bucket.key for bucket in buckets)
              else
                data = [json.hits.total]
                categories = ['全部']
            else
              if @selectedGroup
                buckets = json.aggregations.group_info.buckets
                data = (bucket.metric_value.value for bucket in buckets)
                categories = (bucket.key for bucket in buckets)
              else
                data = [json.aggregations.metric_value.value]
                categories = ['全部']

            $scope.drawChart chartStats, [{
              # name: title
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
                    formatter: () ->
                      return Highcharts.numberFormat(this.y,0)
                    
              title:
                text: title
              tooltip: 
                valueDecimals: 0
                pointFormat: '<b>{point.y}</b>'
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
          else if @selectedChartType.value == 'pie'
            if @type == 'event_count'
              if @selectedGroup
                buckets = json.aggregations.group_info.buckets
                data = ([bucket.key, bucket.doc_count] for bucket in buckets)
              else
                data = [['全部',json.hits.total]]
            else
              if @selectedGroup
                buckets = json.aggregations.group_info.buckets
                data = ([bucket.key, bucket.metric_value.value] for bucket in buckets)
              else
                data = [['全部', json.aggregations.metric_value.value]]

            console.log "mingqi ccc: #{data}"

            $scope.drawChart chartStats, [{
              data: data
            }],
              basicChart: 1
              chart:
                renderTo : chartStats.id
                type: 'pie'
              plotOptions:
                pie:
                  allowPointSelect: true,
                  cursor: 'pointer',
                  dataLabels:
                    enabled: true
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',

              title:
                text: title
              tooltip: 
                pointFormat: '<b>{point.percentage:.1f}</b>'
    
