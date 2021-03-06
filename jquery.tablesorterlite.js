(function ($, _) {
  $(function() {
    $('table.table-sortable').tableSorterLite();
  });

  $.fn.tableSorterLite = function(opts) {
    return this.each(function() {
      opts = opts || {};
      
      var self = this;
        self.$table = $(this);
        self.data = initialize(self.$table, opts);
        self.opts = opts;

      self.$table.find('.sort-header').live('click', function() {
        var $a = $(this),
          criteria = $a.data('sort-label'),
          direction = $a.hasClass('sort-asc') ? 'desc' : 'asc';
          
        $a.parent()
          .parent()
          .find('a')
            .removeClass('sort-asc')
            .removeClass('sort-desc');

        if (direction === 'desc') {
          $a.addClass('sort-desc');
        } else {
          $a.addClass('sort-asc');
        }

        sortTable(self, criteria, direction);
      });

      self.$table.find('.sort-filter').live('change', function(e) {
        var $select = $(this),
          val = $select.val(),
          criteria = $select.parent().find('a').data('sort-label');

          filterTable(self, criteria, val);
      });
    });
  };

  var initialize = function($table, opts) {
    var $headerRow = $table.find('tr:first'),
      $headerCells = $headerRow.find('th');

    var labels = $headerCells.map(function() {
      var $cell = $(this),
        text = $cell.text(),
        label = text.replace(/\s/g, '_').toLowerCase().trim();

      if (label) {
        $cell.empty();
        var $a = $('<a>').text(text)
          .addClass('sort-header')
          .data('sort-label', label)
          .css('cursor', 'pointer')
          .css('display', 'block');
          
        $cell.append($a);
      }
      return label;
    });

    var data = initializeSorting($table, labels);
    
    if (opts.enableFiltering) {
      initializeFiltering(data, labels, $headerCells);
    }

    return data;
  };
  
  var initializeSorting = function($table, labels) {
    var data = [];
    $table.find('tr').not(':first').each(function(index) {
      var $row = $(this),
        $cells = $row.find('td'),
        rowData = { order: index };

      $row.attr('data-sequence', index);

      rowData.$row = $row;

      for (var i = 0; i < labels.length; ++i) {
        var content = $cells.eq(i).text(),
          value = {
            sortable: parseSortable(content),
            content: content
          };
        rowData[labels[i]] = value;
      }
      data.push(rowData);
    });
    return data;
  };
  
  var initializeFiltering = function(data, labels, $headerCells) {
    for (var i = 0; i < labels.length; ++i) {
        var opts = getFilteringOptions(data, labels[i]);

        if (opts.length > 1) {
          opts = opts.sort(function(a, b) {
            if (a.count < b.count) return 1;
            if (a.count > b.count) return -1;
            
            if (a.label < b.label) return -1;
            if (a.label > b.label) return 1;
            return 0;
          });
    
          var $select = $('<select/>')
            .addClass('sort-filter')
            .append('<option value="">All (' + data.length + ')</option>');
            
          opts.forEach(function(opt) {
            var display = opt.label.substring(0, 20).trim();
            if (display === '') {
              display = 'Unspecified';
            }
            $select.append('<option value="' + opt.label + '">' + display + ' (' + opt.count + ')</option>');
          });
    
          $headerCells.eq(i).append($select);
        }
      }
  };
  
  var getFilteringOptions = function(data, label) {
    var options = _.countBy(data, function(item) {
      return item[label].content;
    });

    var opts = [];
    for (var key in options) {
      if (options.hasOwnProperty(key)) {
        opts.push({
          label: key,
          count: options[key]
        });
      }
    }
    
    return opts;
  };

  var filterTable = function(ts, criteria, value) {
    ts.$table.find('tr').not(':first').remove();
    
    var items = [];
    if (value === '') {
      items = ts.data;
    } else {
      items = _.filter(ts.data, function(item) {
        return item[criteria].content == value;
      });
    }
    
    items.forEach(function(item) {
      ts.$table.append(item.$row);
    });
  };

  var sortTable = function(ts, criteria, direction) {
    var orderedTable;
    if (direction === 'asc') {
      orderedTable = ts.data.sort(function(a, b) {
        if (a[criteria].sortable < b[criteria].sortable) return -1;
        if (a[criteria].sortable > b[criteria].sortable) return 1;
        return 0;
      });
    } else {
      orderedTable = ts.data.sort(function(a, b) {
        if (a[criteria].sortable > b[criteria].sortable) return -1;
        if (a[criteria].sortable < b[criteria].sortable) return 1;
        return 0;
      });
    }

    for (var i = 0; i < orderedTable.length; ++i) {
      var rowId = 'tr[data-sequence=' + orderedTable[i].order + ']';
      ts.$table.find(rowId).appendTo(ts.$table);
    }
  };

  var parseSortable = function(content) {
    var asInteger = parseInt(content),
      asDate = parseDate(content),
      asCurrency = null;

    if (content.indexOf('$') === 0) {
      asCurrency = parseFloat(content.replace(/[$,]+/g,""));
    }

    return asDate || asInteger || asCurrency || content.toLowerCase();
  };

  var parseDate = function(dateString) {
    var asDate;
    if (dateString.indexOf('/') > 0) {
      asDate = new Date(dateString);
      if (asDate === 'Invalid Date') {
        asDate = null;
      }
    }
    return asDate;
  };
}(jQuery, _));
