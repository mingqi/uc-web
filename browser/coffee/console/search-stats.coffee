### jshint ignore:start ###

define ['underscore'], (_) ->
  ($scope) ->
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

      changeField: () ->
        @aggs = []

        if @selectedField
          @aggs.push
            title: '唯一值数量'
          if @selectedField.isNumeric
            @aggs = @aggs.concat [{
              title: '求和'
            }, {
              title: '最大值'
            }, {
              title: '最小值'
            }]

      changeAgg: () ->
        # alert(@selectedAgg)
        @groups = []
        if @selectedAgg
          for field in @fields
            if field.key != @selectedField.key and !field.isNumeric
              @groups.push field

      changeGroup: () ->
        # alert(@selectedGroup)

    $stats.selectedChartType = $stats.chartTypes[0]

    if $stats.selectedField
      $stats.aggs.push
        title: '唯一值数量'
      if $stats.selectedField.isNumeric
        $stats.aggs.concat [{
          title: '求和'
        }, {
          title: '最大值'
        }, {
          title: '最小值'
        }]


