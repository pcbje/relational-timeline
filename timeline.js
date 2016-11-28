var timeline = (function() {
  var node_cache = {};
  var type_cache = {};
  var svg;
  var used;

  var config = {
    fontsize: 13,
    padding: 20,
    margin: 4,
    label_width: 120,
    timeline_spacing: 20,
    min_date: '2015-01-01',
    max_date: '2016-12-31',
    circle_size: 8,
    overlap: true,
    curved: true,
    colored_arcs: true,
    arc_opacity: 0.3,
    circle_opacity: 0.9,
    event_label_opacity: 0.75,
    colors: ['#293757', '#568D4B', '#D5BB56', '#D26A1B', '#A41D1A'],
    label_space: 130,
    ticks: 'month'
  }

  var set_config = function(new_config) {
    for (var key in new_config) {
      config[key] = new_config[key]
    }
    return this;
  }

  var padd = function(num) {
    if (num*1 >= 10) return num;
    return '0' + num;
  }

  var format_date = function(date) {
    return date.getFullYear() + '-' + padd(date.getMonth() + 1) + '-' + padd(date.getDate());
  }

  var create = function(id) {
    svg = SVG(id).size(document.body.clientWidth, 100)
    return this;
  }

  var nodes = function(nodes) {
    used = 0;
    var max_width = 0;
    var node_labels = [];
    node_cache = {};

    nodes.map(function(node, idx) {
      if (node.type == 'space') {
        var height = 15;

        var y = used + config.label_space

        svg.rect(svg.width(), height).move(0, y).fill('#000').attr({'opacity': 0.15})
        svg.plain(node.id).font({family: 'Helvetica', size: config.fontsize * 0.8, anchor: 'start', fill: '#000'}).move(3, y+2)

        used += height;
        prev_space = true;
      }
      else {
        var height = config.fontsize + config.padding;
        if (!config.overlap) {
          height = Math.max(height, Object.keys(type_cache).length * (config.circle_size+ 2) + config.padding / 2)
        }
        var pos_y = used + config.label_space;
        used += height + config.margin;
        node.y = pos_y + config.margin;
        var text_y =  pos_y + (height - config.fontsize) / 4
        var text = svg.plain(node.id).move(0, text_y)

        node_labels.push(text);
        text.font({family: 'Helvetica', size: config.fontsize, anchor: 'end'})
        max_width = Math.max(max_width, text.node.getBBox().width)
        svg.height(pos_y + height + config.timeline_spacing + config.label_space)
        node.idx = Object.keys(node_cache).length
        node_cache[node.id] = node;

        if (!prev_space) {
          svg.line(0, pos_y, svg.width(), pos_y).stroke({ width: 1, opacity: 0.1 })
        }
        prev_space = false;
      }
    });

    config.label_width = max_width;

    node_labels.map(function(node_label) {
      node_label.x(config.padding + config.label_width)
    });

    svg.line(0, config.label_space+ used, svg.width(), config.label_space+ used).stroke({ width: 1, opacity: 0.1 })

    return this;
  }

  var event_types = function(event_types) {
    var x = svg.width() - 10;

    type_cache = {};

    event_types.map(function(type, idx) {
      type_cache[type] = idx;
      var text = svg.plain(type).font({family: 'Helvetica', size: config.fontsize * 0.9, anchor: 'start'})
      x -= text.node.getBBox().width + 10
      text.move(x, 20)
      x -= 14
      svg.circle(10).move(x, 21).fill(config.colors[idx % config.colors.length]).attr({'opacity': config.circle_opacity});
      x -= config.margin;
    });

    return this;
  }

  var ticks = function() {
    var start = new Date(config.min_date).getTime();
    var end = new Date(config.max_date).getTime();

    var current = start;
    var tick_size = 60 * 60 * 24 * 1000;

    var ticks = [];
    while (current < end) {
      var tick = new Date(current);

      if (config.ticks == 'day') {
        ticks.push(tick.getTime())
      }

      else if (config.ticks == 'week' && tick.getDay() == 0) {
        ticks.push(tick.getTime())
      }

      else if (config.ticks == 'month' && tick.getDate() == 1) {
        ticks.push(tick.getTime())
      }

      current += tick_size;
    }

    var base_x = config.label_width + 2 * config.padding + config.margin;

    svg.line(base_x, config.label_space, base_x, config.label_space + used).stroke({ width: 1, opacity: 0.1 })

    ticks.map(function(tick) {
      if (tick < start || tick > end) return;
      var pos_x = ((tick - start) / (end - start)) * (svg.width() - config.label_width) + base_x;
      svg.line(pos_x, config.label_space, pos_x, config.label_space + used).stroke({ width: 1, opacity: 0.1 })
    });

    return this;
  }

  var events = function(events) {
    var event_labels = [];
    var min = new Date(config.min_date).getTime();
    var max = new Date(config.max_date).getTime();

    events.map(function(event) {
      if (!(event.type in type_cache)) return;

      var time = new Date(event.timestamp).getTime();
      color = config.colors[type_cache[event.type] % config.colors.length]

      var pos_y = node_cache[event.source].y + config.circle_size;
      var pos_x = ((time - min) / (max - min)) * (svg.width() - config.label_width) + config.label_width + 2 * config.padding + config.margin;

      if (!config.overlap) {
        pos_y = node_cache[event.source].y  + (config.circle_size + 2) * type_cache[event.type];
      }

      if (event.target) {
        var from_x = pos_x + config.circle_size / 2
        var from_y = pos_y + config.circle_size / 2
        var to_x = pos_x + (config.circle_size / 4)
        var to_y = node_cache[event.target].y + config.circle_size;

        if (!config.overlap) {
          to_y = node_cache[event.target].y + (config.circle_size + 2) * type_cache[event.type];
        }

        var arc = config.curved ?
              svg.path().M(from_x, from_y).A(3, 20, 0, 0, 0, {x:to_x, y:to_y})
            : svg.line(from_x, from_y, from_x, to_y);

        arc.attr({ fill: 'none', stroke: config.colored_arcs ? color : '#000', 'stroke-width': 1, 'opacity': config.arc_opacity})
        svg.circle(config.circle_size / 2).move(to_x, to_y).fill(color).attr({'opacity': Math.min(config.arc_opacity * 10, config.circle_opacity)});
      }

      if (event.end) {
        var to_pos_x = ((new Date(event.end).getTime() - min) / (max - min)) * (svg.width() - config.label_width) + config.label_width + 2 * config.padding + config.margin;
        svg.rect(to_pos_x - pos_x, config.circle_size).move(pos_x, pos_y).fill(color).attr({'opacity': config.circle_opacity}).radius(3);
      }
      else {
        svg.circle(config.circle_size).move(pos_x, pos_y).fill(color).attr({'opacity': config.circle_opacity});
      }

      if (event.label) {
        var label_x = pos_x - 15;

        var dir = (node_cache[event.source].idx / Object.keys(node_cache).length).toFixed(0) * 1;

        if (event.legen_dir == 'down') {
          dir = 1;
        }

        var arr;

        // Going down
        if (dir === 1) {
          label_y = svg.height() - config.label_space;
          arr = [
            [pos_x, pos_y+config.circle_size],
            [label_x + 5, pos_y+config.circle_size+10],
            [label_x + 5, label_y]
          ]
        }
        // Going up
        else {
          var label_y = config.label_space - 40;
          arr = [
            [pos_x, pos_y],
            [label_x + 5, pos_y-10],
            [label_x + 5, label_y + 20]
          ]
        }

        var txt = format_date(new Date(event.timestamp)) + ': ' + event.label;

        if (event.end) {
            txt = format_date(new Date(event.timestamp)) + ' to ' + format_date(new Date(event.end))+ ': ' + event.label
        }

        var text = svg.plain(txt).move(label_x, label_y).font({family: 'Helvetica', size: config.fontsize * 0.9, anchor: 'start'}).attr({'opacity': config.event_label_opacity})
        var poly = svg.polyline(arr).fill('none').stroke({ width: 1, 'dasharray': '2, 2', 'color': '#888' }).attr({'opacity': config.event_label_opacity})

        event_labels.push({text: text, dir: dir, poly: poly})
      }
    });

    var added = [];

    event_labels.reverse().map(function(label, a) {
      var r1 = label.text.node.getBoundingClientRect();
      added.map(function(other, b) {
        var r2 = other.text.node.getBoundingClientRect();

        var collision = !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);

        while (collision) {
          var delta = label.dir == 1 ? -1 : 1;
          var arr = label.poly.array().value;
          arr[arr.length-1][1] -= 20*delta
          label.poly.plot(arr)
          label.text.y(label.text.y() - 20*delta);
          r1 = label.text.node.getBoundingClientRect();
          collision = !(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top);
        }
      });

      added.push(label)
    });

    return this;
  }

  return {
    create: create,
    nodes: nodes,
    event_types: event_types,
    ticks: ticks,
    events: events,
    config: set_config
  }
})();
