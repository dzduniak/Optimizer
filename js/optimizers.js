"use strict";

function Optimizer(start, gradient) {
    this.current = start;
    this.gradient = gradient;
}

Optimizer.prototype.take = function (iterations) {
    var result = [this.current];
    for (var i = 1; i < iterations; i++) {
        result.push(this.next());
    }

    return result;
};

// Gradient descent
function GradientDescent(start, gradient, learningRate) {
    Optimizer.call(this, start, gradient);
    this.learningRate = learningRate;
}

GradientDescent.prototype = Object.create(Optimizer.prototype);
GradientDescent.prototype.constructor = GradientDescent;

GradientDescent.prototype.next = function () {
    var learningRate = this.learningRate;
    var gradient = this.gradient(this.current);

    var result = this.current.map(function (theta, i) {
        return theta - learningRate * gradient[i];
    });
    this.current = result;

    return result;
};

// Momentum
function Momentum(start, gradient, learningRate, momentumTerm) {
    Optimizer.call(this, start, gradient);
    this.learningRate = learningRate;
    this.vt = start.map(function () {
        return 0;
    });
    this.momentumTerm = momentumTerm;
}

Momentum.prototype = Object.create(Optimizer.prototype);
Momentum.prototype.constructor = GradientDescent;

Momentum.prototype.next = function () {
    var learningRate = this.learningRate;
    var vtm1 = this.vt;
    var momentum = this.momentumTerm;
    var gradient = this.gradient(this.current);

    this.vt = this.vt.map(function (theta, i) {
        return momentum * vtm1[i] + learningRate * gradient[i];
    });
    var vt = this.vt;
    var result = this.current.map(function (theta, i) {
        return theta - vt[i];
    });
    this.current = result;

    return result;
};

// Nesterov accelerated gradient
function Nesterov(start, gradient, learningRate, momentumTerm) {
    Optimizer.call(this, start, gradient);
    this.learningRate = learningRate;
    this.vt = start.map(function () {
        return 0;
    });
    this.momentumTerm = momentumTerm;
}

Nesterov.prototype = Object.create(Optimizer.prototype);
Nesterov.prototype.constructor = GradientDescent;

Nesterov.prototype.next = function () {
    var learningRate = this.learningRate;
    var vtm1 = this.vt;
    var momentum = this.momentumTerm;
    var gradient = this.gradient(this.current.map(function (theta, i) {
        return theta - momentum * vtm1[i];
    }));

    this.vt = this.vt.map(function (theta, i) {
        return momentum * vtm1[i] + learningRate * gradient[i];
    });
    var vt = this.vt;
    var result = this.current.map(function (theta, i) {
        return theta - vt[i];
    });
    this.current = result;

    return result;
};

// Adagrad
function Adagrad(start, gradient, learningRate) {
    Optimizer.call(this, start, gradient);
    this.learningRate = learningRate;
    this.gt = start.map(function () {
        return 0;
    });
}

Adagrad.prototype = Object.create(Optimizer.prototype);
Adagrad.prototype.constructor = Adagrad;

Adagrad.prototype.next = function () {
    var epsilon = 0.00000001;
    var learningRate = this.learningRate;
    var gradient = this.gradient(this.current);
    this.gt = this.gt.map(function (gt, i) {
        return gt + gradient[i] * gradient[i];
    });
    var gt = this.gt;

    var result = this.current.map(function (theta, i) {
        return theta - (learningRate / Math.sqrt(gt[i] + epsilon)) * gradient[i];
    });
    this.current = result;

    return result;
};

// Adadelta
function Adadelta(start, gradient, smoothingTerm) {
    Optimizer.call(this, start, gradient);
    this.smoothingTerm = smoothingTerm;
    this.vt = start.map(function () {
        return 0;
    });
    this.gt = start.map(function () {
        return 0;
    });
}

Adadelta.prototype = Object.create(Optimizer.prototype);
Adadelta.prototype.constructor = Adadelta;

Adadelta.prototype.next = function () {
    var epsilon = 0.00000001;
    var s = this.smoothingTerm;
    var vt = this.vt;
    var gradient = this.gradient(this.current);
    this.gt = this.gt.map(function (gt, i) {
        return s * gt + (1 - s) * gradient[i] * gradient[i];
    });
    var gt = this.gt;

    var result = this.current.map(function (theta, i) {
        var delta = -(Math.sqrt(vt[i] + epsilon) / Math.sqrt(gt[i] + epsilon)) * gradient[i];
        vt[i] = s * vt[i] + (1 - s) * delta * delta;
        return theta + delta;
    });
    this.current = result;

    return result;
};