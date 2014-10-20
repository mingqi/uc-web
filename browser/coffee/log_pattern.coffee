### jshint ignore:start ###

ESCAPE = ['\\','[',']','.', '^','$', '|', '?', '*', '+', '(', ')', '{', '}']

escape = (str) ->
  for e in ESCAPE
    str = str.replace(e, "\\#{e}")

  return str
    
parse = (statment, end_flag) ->
  _p = /%(\w+)%/g
  _attrs = while _r = _p.exec statment
    _r[1] 

  return {

    attributes : _attrs

    toExtract :  (attribute) ->
      _r = escape(statment).replace("%#{attribute}%", "(?<value>[a-zA-Z0-9_.-]+)")
      _r = _r.replace(_p, '[a-zA-Z0-9_.-]+') 
      return _r

    toFilter : () ->
      regexp = escape(statment).replace(_p, '[a-zA-Z0-9_.-]+')
      if end_flag
        regexp += '\\b'
      return {
        "script" : {
          "script" : "pattern_filter"
          "params" : {
            "pattern" : regexp
          }
        }
      }
  }

pattern = ( pattern_str, end_flag ) ->
  end_flag ?= false

  if not pattern_str
    return {
      query: null
      attributes: []
      filters: []
    }

  terms = []
  parses = []
  for statment in pattern_str.split('|')
    statment = statment.trim()
    if statment.indexOf('parse') == 0
      # this is attribute parse
      parses.push parse(statment.substring(5).trim(), end_flag)
    else
      terms = terms.concat statment.split(/\s+/)

  if terms.length == 0
    query = null
  else
    query = 
      'bool' :
        'must' : for term in terms 
          'match_phrase' : 
            'message' : term

  attributes = [] 
  filters = []
  for p in parses
    attributes = attributes.concat p.attributes
    filters.push p.toFilter()

  return {

    query : query

    attributes : attributes

    filters : filters

    toBucket : (attribute) ->
      for p in parses
        if p.attributes.indexOf(attribute) >= 0
          regexp = p.toExtract(attribute)
          return {
            "script": "pattern_extract", 
            "lang": "groovy", 
            "params": {
              "pattern" : regexp
              "onlyNumber" : false
            }, 
            "size": 300
          }

      return null

    toMetric : (attribute) ->
      for p in parses
        if p.attributes.indexOf(attribute) >= 0
          regexp = p.toExtract(attribute)
          return {
            "script": "pattern_extract", 
            "lang": "groovy", 
            "params": {
              "pattern" : regexp
              "onlyNumber" : true
            }, 
          }

      return null
    

    applyFilter :  (attribute, value) ->
      attr_wrap = "%#{attribute}%"
      new_pattern_str = pattern_str.replace(attr_wrap, value)
      if (pattern_str.indexOf(attr_wrap) + attr_wrap.length) == pattern_str.length
        return pattern(new_pattern_str, true)
      else
        return pattern(new_pattern_str, false)
  }

define () ->
  pattern
