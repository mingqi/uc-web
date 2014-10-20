
/* jshint ignore:start */

(function() {
  var ESCAPE, escape, parse, pattern;

  ESCAPE = ['\\', '[', ']', '.', '^', '$', '|', '?', '*', '+', '(', ')', '{', '}'];

  escape = function(str) {
    var e, _i, _len;
    for (_i = 0, _len = ESCAPE.length; _i < _len; _i++) {
      e = ESCAPE[_i];
      str = str.replace(e, "\\" + e);
    }
    return str;
  };

  parse = function(statment, end_flag) {
    var _attrs, _p, _r;
    _p = /%(\w+)%/g;
    _attrs = (function() {
      var _results;
      _results = [];
      while (_r = _p.exec(statment)) {
        _results.push(_r[1]);
      }
      return _results;
    })();
    return {
      attributes: _attrs,
      toExtract: function(attribute) {
        _r = escape(statment).replace("%" + attribute + "%", "(?<value>[a-zA-Z0-9_.-]+)");
        _r = _r.replace(_p, '[a-zA-Z0-9_.-]+');
        return _r;
      },
      toFilter: function() {
        var regexp;
        regexp = escape(statment).replace(_p, '[a-zA-Z0-9_.-]+');
        if (end_flag) {
          regexp += '\\b';
        }
        return {
          "script": {
            "script": "pattern_filter",
            "params": {
              "pattern": regexp
            }
          }
        };
      }
    };
  };

  pattern = function(pattern_str, end_flag) {
    var attributes, filters, p, parses, query, statment, term, terms, _i, _j, _len, _len1, _ref;
    if (end_flag == null) {
      end_flag = false;
    }
    if (!pattern_str) {
      return {
        query: null,
        attributes: [],
        filters: []
      };
    }
    terms = [];
    parses = [];
    _ref = pattern_str.split('|');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      statment = _ref[_i];
      statment = statment.trim();
      if (statment.indexOf('parse') === 0) {
        parses.push(parse(statment.substring(5).trim(), end_flag));
      } else {
        terms = terms.concat(statment.split(/\s+/));
      }
    }
    if (terms.length === 0) {
      query = null;
    } else {
      query = {
        'bool': {
          'must': (function() {
            var _j, _len1, _results;
            _results = [];
            for (_j = 0, _len1 = terms.length; _j < _len1; _j++) {
              term = terms[_j];
              _results.push({
                'match_phrase': {
                  'message': term
                }
              });
            }
            return _results;
          })()
        }
      };
    }
    attributes = [];
    filters = [];
    for (_j = 0, _len1 = parses.length; _j < _len1; _j++) {
      p = parses[_j];
      attributes = attributes.concat(p.attributes);
      filters.push(p.toFilter());
    }
    return {
      query: query,
      attributes: attributes,
      filters: filters,
      toBucket: function(attribute) {
        var regexp, _k, _len2;
        for (_k = 0, _len2 = parses.length; _k < _len2; _k++) {
          p = parses[_k];
          if (p.attributes.indexOf(attribute) >= 0) {
            regexp = p.toExtract(attribute);
            return {
              "script": "pattern_extract",
              "lang": "groovy",
              "params": {
                "pattern": regexp,
                "onlyNumber": false
              },
              "size": 300
            };
          }
        }
        return null;
      },
      toMetric: function(attribute) {
        var regexp, _k, _len2;
        for (_k = 0, _len2 = parses.length; _k < _len2; _k++) {
          p = parses[_k];
          if (p.attributes.indexOf(attribute) >= 0) {
            regexp = p.toExtract(attribute);
            return {
              "script": "pattern_extract",
              "lang": "groovy",
              "params": {
                "pattern": regexp,
                "onlyNumber": true
              }
            };
          }
        }
        return null;
      },
      applyFilter: function(attribute, value) {
        var attr_wrap, new_pattern_str;
        attr_wrap = "%" + attribute + "%";
        new_pattern_str = pattern_str.replace(attr_wrap, value);
        if ((pattern_str.indexOf(attr_wrap) + attr_wrap.length) === pattern_str.length) {
          return pattern(new_pattern_str, true);
        } else {
          return pattern(new_pattern_str, false);
        }
      }
    };
  };

  define(function() {
    return pattern;
  });

}).call(this);
