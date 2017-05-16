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
var smoothing2 = document.getElementById('smoothing2');

var iterations = document.getElementById('iterations');
iterations.onchange = function () {
    iterations.value = Math.floor(Math.abs(parseFloat(iterations.value)));
};
var deltaFrames = 1;
var frameCount = document.getElementById('frameCount');
frameCount.onchange = function () {
    var value = Math.floor(Math.abs(parseFloat(frameCount.value)))
    frameCount.value = value;
    deltaFrames = value;
};

var plotButton = document.getElementById('plotButton');
var optimizeButton = document.getElementById('optimizeButton');
var animateButton = document.getElementById('animateButton');

var checkboxes = document.getElementById('checkboxes');

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
    var h = 0.00000001;
    var d = 1 / (h * 2);

    return function (p) {
        var x = p[0];
        var y = p[1];

        return [d * (fun(x + h, y) - fun(x - h, y)), d * (fun(x, y + h) - fun(x, y - h))];
    }
}

var optimizers = {
    'Gradient descent': {
        factory: function (start, gradient, learningRate, momentumTerm, smoothingTerm, smoothingTerm2) {
            return new GradientDescent(start, gradient, learningRate);
        },
        color: 'red'
    },
    'Momentum': {
        factory: function (start, gradient, learningRate, momentumTerm, smoothingTerm, smoothingTerm2) {
            return new Momentum(start, gradient, learningRate, momentumTerm);
        },
        color: 'lawngreen'
    },
    'Nesterov accelerated gradient': {
        factory: function (start, gradient, learningRate, momentumTerm, smoothingTerm, smoothingTerm2) {
            return new Nesterov(start, gradient, learningRate, momentumTerm);
        },
        color: 'pink'
    },
    'Adagrad': {
        factory: function (start, gradient, learningRate, momentumTerm, smoothingTerm, smoothingTerm2) {
            return new Adagrad(start, gradient, learningRate);
        },
        color: 'blue'
    },
    'Adadelta': {
        factory: function (start, gradient, learningRate, momentumTerm, smoothingTerm, smoothingTerm2) {
            return new Adadelta(start, gradient, smoothingTerm);
        },
        color: 'yellow'
    },
    'Adam': {
        factory: function (start, gradient, learningRate, momentumTerm, smoothingTerm, smoothingTerm2) {
            return new Adam(start, gradient, learningRate, smoothingTerm, smoothingTerm2);
        },
        color: 'maroon'
    }
};

$.each(optimizers, function (key, value) {
    var paragraph = document.createElement('p');

    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.id = key.replace(/\s/g, '');
    checkbox.onchange = function () {
        togglePath(key);
    };

    var label = document.createElement('label');
    label.className = 'optimizer';
    label.style.color = value.color;
    label.htmlFor = checkbox.id;
    label.appendChild(document.createTextNode(key));

    paragraph.appendChild(checkbox);
    paragraph.appendChild(label);
    checkboxes.appendChild(paragraph);

    value.visible = true;
});

function createPath(fun, optimizer, offset, iterations, color) {
    var path = optimizer.take(iterations);
    var x = path.map(function (it) {
        return it[0];
    });
    var y = path.map(function (it) {
        return it[1];
    });
    var z = path.map(function (it) {
        return fun(it[0], it[1]) + offset;
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

function copyPath(path) {
    return {
        x: path.x.slice(),
        y: path.y.slice(),
        z: path.z.slice()
    }
}

var numOfPaths = 0;
function clearPaths() {
    for (var i = 0; i < numOfPaths; i++) {
        Plotly.deleteTraces(plot, 1);
    }

    numOfPaths = 0;
}

function drawPaths() {
    $.each(optimizers, function (key, value) {
        if (value.visible) {
            Plotly.plot(plot, [value.path]);
            numOfPaths++;
        }
    });
}

function optimize() {
    animationEnabled = false;
    animateButton.textContent = "Animate"
    var body = textarea.value;
    var fun = Function("x", "y", body);

    var rngz = [parseFloat(zstart.value), parseFloat(zend.value)];
    var epsilon = (rngz[1] - rngz[0]) * .005;
    var iters = parseInt(iterations.value);
    currentFrame = iters;
    maxFrame = iters;

    var start = [parseFloat(startx.value), parseFloat(starty.value)];
    var grad = gradient(fun);
    var learningRate = parseFloat(learning.value);
    var momentumTerm = parseFloat(momentum.value);
    var smoothingTerm = parseFloat(smoothing.value);
    var smoothingTerm2 = parseFloat(smoothing2.value);

    var offset = epsilon;
    $.each(optimizers, function (key, value) {
        var optimizer = value.factory(start, grad, learningRate, momentumTerm, smoothingTerm, smoothingTerm2);
        value.path = createPath(fun, optimizer, offset, iters, value.color);
        value.frames = makeFrames(value.path, maxFrame);
        offset += epsilon;
    });
}

function togglePath(key) {
    optimizers[key].visible = !(optimizers[key].visible);
    var i = Object.keys(optimizers).indexOf(key);
    if (!optimizers[key].visible) {
        Plotly.animate(plot, {
            data: [{x: [], y: [], z: []}],
            traces: [i + 1]
        }, {
            transition: {
                duration: 0
            },
            frame: {
                duration: 0,
                redraw: false
            }
        });
    } else {
        Plotly.animate(plot, {
            data: [optimizers[key].frames[currentFrame]],
            traces: [i + 1]
        }, {
            transition: {
                duration: 0
            },
            frame: {
                duration: 0,
                redraw: false
            }
        });
    }
}

function drawPlot() {
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
    numOfPaths = 0;
    optimize();
    drawPaths();

    plot.on('plotly_click', function (data) {
        if (data.points.length === 1) {
            var point = data.points[0];

            startx.value = point.x.toPrecision(4) / 1;
            starty.value = point.y.toPrecision(4) / 1;
        }
    });
}

function makeFrames(path, i) {
    var frames = [];

    function helper(a, i) {
        return a.slice(0, i + 1);
    }

    for (var f = 0; f<=i; f++) {
        var x = helper(path.x, f);
        var y = helper(path.y, f);
        var z = helper(path.z, f);

        frames.push({x: x, y: y, z: z});
    }

    return frames;
}

var animationEnabled = false;
var currentFrame = 0;
var maxFrame = 300;
function animate() {
    var traces = [];
    var frames = [];
    $.each(optimizers, function (key, optimizer) {
        if (optimizer.visible) {
            var i = Object.keys(optimizers).indexOf(key);
            frames.push(optimizer.frames[currentFrame]);
            traces.push(i + 1);
        }
    });

    Plotly.animate(plot, {
        data: frames,
        traces: traces
    }, {
        transition: {
            duration: 0
        },
        frame: {
            duration: 0,
            redraw: false
        }
    });

    currentFrame += deltaFrames;
    if (currentFrame > maxFrame)
        currentFrame = 0;

    if (animationEnabled)
        requestAnimationFrame(animate);
}

var pane = $('div.split-pane');
pane.on('splitpaneresize', function () {
    Plotly.Plots.resize(plot);
});

plotButton.onclick = function () {
    drawPlot();
};

optimizeButton.onclick = function () {
    clearPaths();
    optimize();
    drawPaths();
};

animateButton.onclick = function () {
    animationEnabled = !animationEnabled;
    if (animationEnabled) {
        animate();
        animateButton.textContent = "Pause";
    } else {
        animateButton.textContent = "Animate";
    }
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
