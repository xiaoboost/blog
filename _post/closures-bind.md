title: Function.prototype.bind
category: 软件设计
date: 2016-06-08
tag: [JavaScript,规范]
layout: post
toc: true

---

这个东西是我偶然想到的，之前在写矩阵求解器的时候，给每个元素封装了很多接口，其中一个是某种特殊的运算，这个运算根据元素不同内部的参数也不同，最开始直接用的bind将参数绑定的，那速度简直太惨了，后来经人提醒换成了闭包，效果才比较能接受。于是我就有了探究bind方法的想法。
<!--more-->

<p class="warning">
本文中的所有规范均是ES6版本的。
</p>

JavaScript中的函数也是值，当然也可以到处传递，经常会有这样的需求，那就是根据不同情况生成不同的函数，函数的主体结构是一样的，只是内部有些参数不同。实现这样的需求并不难，有两种比较典型的做法，一个是使用闭包，在闭包中保存参数最后返回函数本身，还有一个就是用函数直接将参数bind，这样在函数内就能直接使用`this`了。
闭包自不必说了，除了作用域不会被垃圾回收之外，它的调用和普通函数一样，本文主要就是讲述`bind`之后的函数相比普通函数的区别。

# 实验
先做个简单的实验：
```javascript
function func (method) {
    var obj = { "name" : 1 };
	
    if(method === 1) {
		return(function(i) {
			obj.name = i;
		});
    } else if(method === 2) {
		return(function(i) {
			this.name = i;
		}.bind(obj));
	}
}
function test (func) {
	let i;
	for (i = 0;i < 10000000; i++)  {
		func(i);
	}
}
console.time('Closure');
test(func(1));
console.timeEnd('Closure');
console.time('Bind');
test(func(2));
console.timeEnd('Bind');

//Closure: 6.058ms
//Bind: 86.811ms
```

`func`函数中有一个公共的对象obj，当`method === 1`的时候返回一个直接操作obj的函数，这是闭包方法；当`method === 2`的时候返回一个操作this指针的函数，而这个函数将绑定`obj`为它的`this`。
结果差异非常显著：由于电脑性能的不同，在不同电脑上运行的结果可能会有差异，但是这个近14倍的差距确是毋容置疑的。

到底是什么造成了这样的差距？

# 函数调用
先来说说函数调用，函数调用实际上就是调用函数对象内置的`[[call]]`方法，普通函数对象的这个方法在规范中是这样的：
> [[Call]] ( thisArgument, argumentsList)
1. Assert: F is an ECMAScript function object.
2. If F’s [[FunctionKind]] internal slot is "classConstructor", throw a TypeError exception.
3. Let callerContext be the running execution context.
4. Let calleeContext be PrepareForOrdinaryCall(F, undefined).
5. Assert: calleeContext is now the running execution context.
6. Perform OrdinaryCallBindThis(F, calleeContext, thisArgument).
7. Let result be OrdinaryCallEvaluateBody(F, argumentsList).
8. Remove calleeContext from the execution context stack and restore callerContext as the running execution context.
9. If result.[[type]] is return, return NormalCompletion(result.[[value]]).
10. ReturnIfAbrupt(result).
> 11. Return NormalCompletion(undefined).

虽然很长，其实很简单的：
1. 令`F`为函数对象
2. 令`callerContext`为函数运行的上下文
3. 绑定当前函数的`this`
4. 运行当前函数，并令`result`为函数运行结果
5. 若`result`有值，那么返回它，否则返回`undefined`

我们都知道，`bind`方法将会改变函数运行的上下文，也就是改变函数运行时的`this`，上文中我们也看到普通函数调用也是要绑定`this`的，那么我们先看看它是如何在运行时绑定`this`的。

在上述步骤中，绑定`this`的是这个函数`OrdinaryCallBindThis`，我们继续看规范：
> OrdinaryCallBindThis ( F, calleeContext, thisArgument )
1. Let thisMode be the value of F’s [[thisMode]] internal slot.
2. If thisMode is lexical, return NormalCompletion(undefined).
3. Let calleeRealm be the value of F’s [[Realm]] internal slot.
4. Let localEnv be the LexicalEnvironment of calleeContext.
5. If thisMode is strict, let thisValue be thisArgument.
6. Else
   1. if thisArgument is null or undefined, then
      1. Let thisValue be calleeRealm.[[globalThis]].
   2. Else
      1. Let thisValue be ToObject(thisArgument).
      2. Assert: thisValue is not an abrupt completion.
      3. NOTE ToObject produces wrapper objects using calleeRealm.
7. Let envRec be localEnv’s EnvironmentRecord.
8. Assert: The next step never returns an abrupt completion because envRec.[[thisBindingStatus]] is not "uninitialized".
> 9. Return envRec.BindThisValue(thisValue).

这里就比较复杂了，变量也比较多，咱们挨个来。
`thisMode`，这个变量是来自函数`F`的内部参数`[[ThisMode]]`，这个值代表着函数内`this`的取值方式，它一共有三个取值：
1. `lexical`，此时`this`的值将会是函数所在封闭作用域的那个`this`（箭头函数的`词法this`）
2. `strict`，此时`this`会等于函数调用的变量`thisArgument`
3. `global`，如果此时`thisArgument`未定义，那么此时`this`会指向全局变量

`calleeRealm`，这个变量是函数`F`的内部参数`[[Realm]]`，它是在函数运行之前的准备数据。但是，它并不是环境参数，代表函数词法环境的是另一个内建参数`[[Environment]]`。
`calleeContext`，这个输入的变量代表着执行的上下文环境。
`localEnv`，这个变量是`calleeContext`之中的词法环境。
`envRec`，而这个变量是`localEnv`之中的环境记录，它包含了当前运行环境中的所有声明和对象环境。
在最后，将`thisValue`绑定到`envRec`之中，函数运行的准备就完成了。

可以看到，在普通的函数调用中，`this`的绑定是由运行时的上下文来决定的。函数调用就是调用函数对象自身的`[[call]]`方法。

# `bind`方法
那么，我们现在再来看看`bind`方法都做了什么：
> Function.prototype.bind ( thisArg, ...args)
1. Let Target be the this value.
2. If IsCallable(Target) is false, throw a TypeError exception.
3. Let args be a new (possibly empty) List consisting of all of the argument values provided after thisArg in order.
4. Let F be ? BoundFunctionCreate(Target, thisArg, args).
5. Let targetHasLength be ? HasOwnProperty(Target, "length").
6. If targetHasLength is true, then
   1. Let targetLen be ? Get(Target, "length").
   2. If Type(targetLen) is not Number, let L be 0.
   3. Else,
      1. Let targetLen be ToInteger(targetLen).
      2. Let L be the larger of 0 and the result of targetLen minus the number of elements of args.
7. Else, let L be 0.
8. Perform ! DefinePropertyOrThrow(F, "length", PropertyDescriptor {[[Value]]: L, [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]: true}).
9. Let targetName be ? Get(Target, "name").
10. If Type(targetName) is not String, let targetName be the 11. empty string.
12. Perform SetFunctionName(F, targetName, "bound").
> 13. Return F.

可以看到，在这里它创建并返回了个新的函数`F`，这个函数的诸多属性和原本的函数都是一样的，唯一有一点，就是构造这个新函数的方法是`BoundFunctionCreate`。
我们来看看这个特殊的方法是什么：

> BoundFunctionCreate (targetFunction, boundThis, boundArgs)
1. Assert: Type(targetFunction) is Object.
2. Let proto be ? targetFunction.[[GetPrototypeOf]]\(\).
3. Let obj be a newly created object.
4. Set obj's essential internal methods to the default ordinary object definitions specified in 9.1.
5. Set the [[Call]] internal method of obj as described in 9.4.1.1.
6. If targetFunction has a [[Construct]] internal method, then
   1. Set the [[Construct]] internal method of obj as described in 9.4.1.2.
7. Set obj.[[Prototype]] to proto.
8. Set obj.[[Extensible]] to true.
9. Set obj.[[BoundTargetFunction]] to targetFunction.
10. Set obj.[[BoundThis]] to boundThis.
11. Set obj.[[BoundArguments]] to boundArgs.
> 12. Return obj.

可以看到，这个构造函数的实例是继承了原版函数的，不过修改了`[[call]]`属性，而且还新增加了`[[BoundTargetFunction]]`、`[[BoundThis]]`以及`[[BoundArguments]]`这三个属性。
这三个新增的属性，从名字就能看出它们是绑定的目标函数，绑定的`this`，以及绑定的输入参数。
这个新的实例在规范中的名字是叫`bound function`。好直白……绑定函数……

# 绑定函数的调用
既然最终返回的`F`函数还修改了`[[call]]`，那么这个新的`[[call]]`是什么样的呢：
> [[Call]] ( thisArgument, argumentsList)
1. Let target be F.[[BoundTargetFunction]].
2. Let boundThis be F.[[BoundThis]].
3. Let boundArgs be F.[[BoundArguments]].
4. Let args be a new list containing the same values as the list boundArgs in the same order followed by the same values as the list argumentsList in the same order.
> 5. Return ? Call(target, boundThis, args).

就是把内部参数取出之后调用了`Call`。这个`Call`是JavaScript内部的抽象函数，并没有对外暴露的，它的过程其实很简单。
> Call (F, V [ , argumentsList ])
1. If argumentsList was not passed, let argumentsList be a new empty List.
2. If IsCallable(F) is false, throw a TypeError exception.
> 3. Return ? F.[[Call]]\(V, argumentsList\).

可以看到它只是做了格式检查，然后就直接调用函数`F`了。这个函数`F`就是原来我们绑定的原函数，这里就又回到普通函数调用那里了。

# 总结
到此为止我们可以看出，我们可以做总结了：
1. 函数调用，实际上都是调用其内部的`[[call]]`方法。
2. `bind`方法会生成一个继承自`Function`的实例，这个实例外带新增了三个参数（绑定时的参数），并修改了自身的`[[call]]`。
3. `bind`方法生成的函数在调用的时候依旧会调用内部的`[[call]]`方法，但是这个方法只是取出参数之后又去调用了另外一个`Call`函数，最后才会调用真正的函数。
4. 也就是说`bind`方法生成的函数最后在调用的时候，比普通的函数调用多了2个步骤。那么它比闭包的函数速度慢也确实是理所当然的。
