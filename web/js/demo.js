"use strict";

var plot = document.getElementById('plot');
var select = document.getElementById('select');
var textarea = document.getElementById('function');

var xstart = document.getElementById('xstart');
var xend = document.getElementById('xend');

var ystart = document.getElementById('ystart');
var yend = document.getElementById('yend');

var zstart = document.getElementById('zstart');
var zend = document.getElementById('zend');

var startx = document.getElementById('startx');
var starty = document.getElementById('starty');

var learning = document.getElementById('learning');
var momentum = document.getElementById('momentum');
var smoothing = document.getElementById('smoothing');

var iterations = document.getElementById('iterations');
iterations.onchange = function () {
    iterations.value = Math.floor(Math.abs(parseFloat(iterations.value)));
};

var plotButton = document.getElementById('plotButton');
var optimizeButton = document.getElementById('optimizeButton');

var predefined = {
    'Hyperbolic paraboloid': {
        body: 'return x * x - y * y;',
        xrange: [-1, 1],
        yrange: [-1, 1],
        zrange: [-1.5, 1.5],
        x: -0.5,
        y: 0.01
    },
    'Ripple': {
        body: 'return Math.sin(10 * (x * x + y * y)) / 20 + Math.pow(x - .5, 2) * .3 + Math.pow(y - .2, 2) * .2;',
        xrange: [-1.8, 1.8],
        yrange: [-1.8, 1.8],
        zrange: [-.5, 3],
        x: -1.386,
        y: -1.152
    },
    'Paraboloid': {
        body: 'return x * x + y * y;',
        xrange: [-1, 1],
        yrange: [-1, 1],
        zrange: [-.5, 3],
        x: -.5,
        y: -.5
    },
    'Beale\'s function': {
        body: 'return (Math.pow((1.5 - x + x * y), 2) + Math.pow((2.25 - x + x * y * y), 2) + Math.pow((2.625 - x + x * y * y * y), 2)) * .0001;',
        xrange: [-4, 4],
        yrange: [-4, 4],
        zrange: [-2, 10],
        x: -3,
        y: -3
    },
    'Styblinski-Tang function': {
        body: 'return ((Math.pow(x, 4) - 16 * x * x + 5 * x) + (Math.pow(y, 4) - 16 * y * y + 5 * y)) / 2;',
        xrange: [-4, 4],
        yrange: [-4, 4],
        zrange: [-100, 100],
        x: -0.2,
        y: 0.88
    },
    'McCormick function': {
        body: 'return Math.sin(x + y) + Math.pow(x - y, 2) - 1.5 * x + 2.5 * y + 1;',
        xrange: [-1.5, 4],
        yrange: [-3, 4],
        zrange: [-10, 50],
        x: -0.6475,
        y: 3.44
    },
    'Rosenbrock function': {
        body: 'return .01 * (100 * Math.pow(y - x * x, 2)) + Math.pow(1 - x, 2)',
        xrange: [-2, 2],
        yrange: [-1, 3],
        zrange: [-3, 40],
        x: 1.5,
        y: -.5
    },
    'Goldstein-Price function': {
        body: 'return .00001 * (1 + Math.pow(x + y + 1, 2) * (19 - 14 * x + 3 * x * x - 14 * y + 6 * x * y + 3 * y * y)) * ' +
        '(30 + Math.pow(2 * x - 3 * y, 2) * (18 - 32 * x + 12 * x * x + 48 * y - 36 * x * y + 27 * y * y))',
        xrange: [-2, 2],
        yrange: [-2, 1.5],
        zrange: [-3, 6],
        x: -1,
        y: 1
    }
};
var saved = {};

function addOption(name) {
    var option = document.createElement('option');
    option.text = name;
    select.add(option);
}

function load(saved) {
    textarea.value = saved.body;

    xstart.value = saved.xrange[0];
    xend.value = saved.xrange[1];

    ystart.value = saved.yrange[0];
    yend.value = saved.yrange[1];

    zstart.value = saved.zrange[0];
    zend.value = saved.zrange[1];

    startx.value = saved.x;
    starty.value = saved.y;
}

function createSurface(fun, steps, xrange, yrange) {
    function range(start, end) {
        return {start: start, end: end};
    }

    xrange = range(xrange[0], xrange[1]);
    yrange = range(yrange[0], yrange[1]);

    var xdata = [];
    var ydata = [];
    var zdata = [];

    var x = xrange.start;
    var y = yrange.start;

    var stepX = (xrange.end - xrange.start) / steps;
    var stepY = (yrange.end - yrange.start) / steps;

    for (var j = 0; j <= steps; j++) {
        x = xrange.start;

        var xtmp = [];
        var ytmp = [];
        var ztmp = [];
        for (var i = 0; i <= steps; i++) {
            xtmp.push(x);
            ytmp.push(y);
            ztmp.push(fun(x, y));
            x += stepX;
        }
        xdata.push(xtmp);
        ydata.push(ytmp);
        zdata.push(ztmp);

        y += stepY;
    }

    return {x: xdata, y: ydata, z: zdata, type: 'surface', colorscale: 'Portland'};
}

function gradient(fun) {
    var h = 0.0001;
    var d = 1 / (h * 2);

    return function (p) {
        var x = p[0];
        var y = p[1];

        return [d * (fun(x + h, y) - fun(x - h, y)), d * (fun(x, y + h) - fun(x, y - h))];
    }
}

function createOptimizers(fun, start, learningRate, momentumTerm, smoothingTerm) {
    var g = gradient(fun);

    return [
        new GradientDescent(start, g, learningRate),
        new Momentum(start, g, learningRate, momentumTerm),
        new Nesterov(start, g, learningRate, momentumTerm),
        new Adagrad(start, g, learningRate),
        new Adadelta(start, g, smoothingTerm)
    ];
}

function createPath(fun, optimizer, epsilon, iterations, color) {
    var path = optimizer.take(iterations);
    var x = path.map(function (it) {
        return it[0];
    });
    var y = path.map(function (it) {
        return it[1];
    });
    var z = path.map(function (it) {
        return fun(it[0], it[1]) + epsilon;
    });

    return {
        type: 'scatter3d',
        mode: 'lines',
        x: x,
        y: y,
        z: z,
        opacity: 1,
        line: {
            width: 6,
            color: color
        }
    };
}

var numOfPaths = 0;

function clearPaths() {
    for (var i = 0; i < numOfPaths; i++) {
        Plotly.deleteTraces(plot, 1);
    }

    numOfPaths = 0;
}

function drawPath(path) {
    Plotly.plot(plot, [path]);
    numOfPaths++;
}

function optimize() {
    var body = textarea.value;
    var fun = Function("x", "y", body);

    var x = parseFloat(startx.value);
    var y = parseFloat(starty.value);
    var rngz = [parseFloat(zstart.value), parseFloat(zend.value)];

    var optimizers = createOptimizers(fun, [x, y], parseFloat(learning.value), parseFloat(momentum.value), parseFloat(smoothing.value));
    var epsilon = (rngz[1] - rngz[0]) * .005;
    var iter = parseInt(iterations.value);

    clearPaths();

    drawPath(createPath(fun, optimizers[0], epsilon, iter, 'red'));
    drawPath(createPath(fun, optimizers[1], epsilon * 1.5, iter, 'lawngreen'));
    drawPath(createPath(fun, optimizers[2], epsilon * 2, iter, 'pink'));
    drawPath(createPath(fun, optimizers[3], epsilon * 2.5, iter, 'blue'));
    drawPath(createPath(fun, optimizers[4], epsilon * 3, iter, 'yellow'));
}

function drawPlot() {
    numOfPaths = 0;

    var body = textarea.value;
    var fun = Function("x", "y", body);

    var rngx = [parseFloat(xstart.value), parseFloat(xend.value)];
    var rngy = [parseFloat(ystart.value), parseFloat(yend.value)];
    var rngz = [parseFloat(zstart.value), parseFloat(zend.value)];
    var data = createSurface(fun, 200, rngx, rngy);

    var layout = {
        scene: {
            xasis: {
                range: rngx
            },
            yaxis: {
                range: rngy
            },
            zaxis: {
                range: rngz
            }
        },
        autosize: true,
        showlegend: false
    };

    Plotly.newPlot(plot, [data], layout);
    optimize();

    plot.on('plotly_click', function (data) {
        if (data.points.length === 1) {
            var point = data.points[0];

            startx.value = point.x.replace("\u2212", "-");
            starty.value = point.y.replace("\u2212", "-");
        }
    });
}

var pane = $('div.split-pane');
pane.on('splitpaneresize', function () {
    Plotly.Plots.resize(plot);
});

plotButton.onclick = function () {
    drawPlot();
};

optimizeButton.onclick = function () {
    optimize();
};

select.onchange = function () {
    if (select.value in predefined) {
        load(predefined[select.value]);
    } else if (select.value in saved) {
        load(saved[select.value]);
    }
    drawPlot();
};

$.each(predefined, function (key, value) {
    addOption(key, value);
});

$.each(saved, function (key, value) {
    addOption(key, value);
});

load(Object.values(predefined)[0]);
drawPlot();
