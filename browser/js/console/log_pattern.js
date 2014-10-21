
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
    var attributes, filters, p, parses, query, tempSpace, term, terms, _i, _len;
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
    tempSpace = '<s-p-a-c-e>';
    terms = pattern_str.replace(/(^|\s)"([^"]+)"($|\s)/g, function(match, p1) {
      return p1.replace(/\s+/g, tempSpace);
    }).split(/\s+/);
    parses = [];
    if (terms.length === 0) {
      query = null;
    } else {
      query = {
        bool: {
          must: (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = terms.length; _i < _len; _i++) {
              term = terms[_i];
              _results.push({
                match_phrase: {
                  message: term.replace(tempSpace, ' ')
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
    for (_i = 0, _len = parses.length; _i < _len; _i++) {
      p = parses[_i];
      attributes = attributes.concat(p.attributes);
      filters.push(p.toFilter());
    }
    return {
      query: query,
      attributes: attributes,
      filters: filters,
      toBucket: function(attribute) {
        var regexp, _j, _len1;
        for (_j = 0, _len1 = parses.length; _j < _len1; _j++) {
          p = parses[_j];
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
        var regexp, _j, _len1;
        for (_j = 0, _len1 = parses.length; _j < _len1; _j++) {
          p = parses[_j];
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
