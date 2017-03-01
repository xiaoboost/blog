title: “简单”的Promise
category: 软件设计
date: 2016-10-20
tag: [JavaScript,规范,异步]
layout: post
toc: true

---

Promise是在ES6引入的，它的出现是为了解决JavaScript在异步编程上的缺陷。不仅解决了回调金字塔，还能够让我们更好的控制异步程序的流程。但我在使用它的过程中，却总觉得实在是有点难以理解，虽然它可以取消回调，但是它本身却又是依赖回调实现的，使用过程中各个函数跳来跳去的，实在是让我感到头晕。即便是在阅读了规范之后也觉得有点云里雾里，于是乎就决定自己尝试实现一个简单的Promise，以增进对它的理解。本文就是个人对于Promise的笔记。
<!--more-->

<p class="warning">
如果你对`Promise`不太了解，我建议你先去看看它是如何使用的：[ES6入门：Promise对象](http://es6.ruanyifeng.com/#docs/promise)。
本文参考的规范是`ES6`而不是`Promise/A+`，其实它们都大同小异，只是在某些细节上有些区别。
另外，本文虽然是参考了规范，但并不是完全按照规范的步骤来进行实现的。规范中为了兼容各种情况，有着大量的类型、状态、格式检查，本文只为了展示原理，所以代码只会保留最低限度的错误检查。
</p>

# 简述
在这里我们只考虑实现一个最为简单的`Promise`类，它只有构造函数本身以及`then`方法。
`Promise`最为常见的用法就是将异步方法用`then`链式调用串联到一起，既然是这样的结构，那么很明显`then`方法最后必定会返回`Promise`类。既然Promise主要是用于处理异步编程时候的回调问题，那么在处理链式调用的时候必定会先把所有的异步回调按照顺序存起来，然后在某个时间点取出运行。
这么说起来，似乎Promise的运行方式和其他涉及异步的库很像，都是类似的手工管理堆栈的编程方式。不过Promise不一样的地方就是在于，它取出回调并运行之的契机是在于前一个Promise的状态。
这样的话，`Promise`的结构就并不是纯粹的堆栈了，它更像是链表，从第一个`Promise`开始，每个`then`都会返回一个新的`Promise`，它们一环套一环将所有的回调串联了起来。

<p class="note">
`Promise`是异步函数，所以不要陷入同步运行的思维定势之中，尤其不要把回调和`Promise`本身混淆了，把回调当作是普通的参数就行了。`Promise`本身只是起着将回调串联起来的任务，回调函数的运行在绝大部分情况下和`Promise`本身并不是同步的。
</p>

有了上述的感性认识，下面我们就来实现一个`Promise`吧。

# 构造函数
按照`ES6`的规范，构造`Promise`类的实例是下面这样的：
```javascript
var promise = new Promise(function(resolve, reject) {
	// ... some code

	if (/* 异步操作成功 */){
		resolve(value);
	} else {
		reject(error);
	}
});
```
所以，我们使用通用的构造函数方式来构建`Promise`类就行了：
```javascript
function Promise(executor) {
	//code..
}
Promise.prototyoe.then = function(resolve, reject){
	//code..
}
```

<p class="note">
当然，你要是想用`class`也没问题，效果是一样的。
</p>

那么，接下来就要搬出规范了，来看看规范对于`Promise`的构造函数是如何描述的：
> **Promise** ( *executor* )
> 
> When the Promise function is called with argument *executor*, the following steps are taken:
1. If NewTarget is undefined, throw a TypeError exception.
2. If IsCallable(executor) is false, throw a TypeError exception.
3. Let promise be ? OrdinaryCreateFromConstructor(NewTarget, "%PromisePrototype%", « [[PromiseState]], [[PromiseResult]], [[PromiseFulfillReactions]], [[PromiseRejectReactions]], [[PromiseIsHandled]] »).
4. Set promise.[[PromiseState]] to "pending".
5. Set promise.[[PromiseFulfillReactions]] to a new empty List.
6. Set promise.[[PromiseRejectReactions]] to a new empty List.
7. Set promise.[[PromiseIsHandled]] to false.
8. Let resolvingFunctions be CreateResolvingFunctions(promise).
9. Let completion be Call(executor, undefined, « resolvingFunctions.[[Resolve]], resolvingFunctions.[[Reject]] »).
10. If completion is an abrupt completion, then
11. Perform ? Call(resolvingFunctions.[[Reject]], undefined, « completion.[[Value]] »).
12. Return promise.

我们挨着解释，`NewTarget`就是指`this`，当它等于`undefined`的时候抛出类型错误，什么时候`this`会等于`undefined`？使用构造函数的时候忘了用`new`就会这样。
`IsCallable`方法是判断输入函数是否能够被调用，这是规范中内部的抽象方法，我们实际中可以直接判断它是不是函数就行了。
第3步就是创造当前实例的内部属性，我们在这里简化操作，就直接将这些属性挂在对象内部了。4、5、6、7都是属性赋值，不多说。
第8步使用`CreateResolvingFunctions`方法返回了一个对象，这个对象内部包含了`Promise`中的`Resolve`和`Reject`函数。这里创建出来的两个函数非常`特殊`，至于它们特殊在哪里，我先卖个关子，之后再告诉大家。
第9、10、11步是把生成的`Resolve`和`Reject`函数当作参数输入`executor`，并运行`executor`。如果运行出错，那么直接运行`Reject`。
最后返回当前对象。

那么，根据以上的规范，我们就能写出构造函数的基本框架了：
```javascript
// 是否是函数
function isFunction(func){
    return(typeof func === "function");
}
// 创建Resolve和reject函数
function createResolvingFunctions(promise) {

	//code..
	
	return({
		resolve: resolve,
		reject: reject
	});
}
// 构造函数
function Promise(executor) {
	this.PromiseState = 'pending';
	this.PromiseFulfillReactions = [];
	this.PromiseRejectReactions = [];

	const resolvingFunctions = createResolvingFunctions(this);

	try {
		executor(
			resolvingFunctions.resolve,
			resolvingFunctions.reject
		);
	} catch (e) {
		resolvingFunctions.reject(e);
	}
}
```
在这里，因为`IsCallable`方法之后还会陆续用上，所以我把它单独抽了出来，改名字叫`isFunction`，实际上里面就是直接用`typeof`判断是不是函数。
`createResolvingFunctions`函数就是上面提到的那个特殊函数，最后返回了一个包含`resolve`和`reject`两个函数的对象。
`[[ ]]`这样的内部属性直接以对象属性的形式挂在了`this`上面，其中`PromiseState`就是指当前状态，而`PromiseFulfillReactions`和`PromiseRejectReactions`就是两种回调的队列。

# `resolve`和`reject`
这两个函数将会作为参数传递到`executor`函数中运行，它们的作用就是让我们在异步函数中改变当前`Promise`实例状态。还是先来看看它们的规范：
> Promise **Reject** Functions
>
> When a promise reject function *F* is called with argument *reason*, the following steps are taken:
> 
1. Assert: F has a [[Promise]] internal slot whose value is an Object.
2. Let promise be F.[[Promise]].
3. Let alreadyResolved be F.[[AlreadyResolved]].
4. If alreadyResolved.[[Value]] is true, return undefined.
5. Set alreadyResolved.[[Value]] to true.
6. Return RejectPromise(promise, reason).

可以看到，在这里面只是做了些值检查，然后就跳转到了`RejectPromise`方法。

> Promise **Resolve** Functions
> 
> When a promise resolve function *F* is called with argument *resolution*, the following steps are taken:
> 
1. Assert: F has a [[Promise]] internal slot whose value is an Object.
2. Let promise be F.[[Promise]].
3. Let alreadyResolved be F.[[AlreadyResolved]].
4. If alreadyResolved.[[Value]] is true, return undefined.
5. Set alreadyResolved.[[Value]] to true.
6. If SameValue(resolution, promise) is true, then
   1. Let selfResolutionError be a newly created TypeError object.
   2. Return RejectPromise(promise, selfResolutionError).
7. If Type(resolution) is not Object, then
   1. Return FulfillPromise(promise, resolution).
8. Let then be Get(resolution, "then").
9. If then is an abrupt completion, then
   1. Return RejectPromise(promise, then.[[Value]]).
10. Let thenAction be then.[[Value]].
11. If IsCallable(thenAction) is false, then
   1. Return FulfillPromise(promise, resolution).
12. Perform EnqueueJob("PromiseJobs", PromiseResolveThenableJob, « promise, resolution, thenAction »).
13. Return undefined.

`Resolve`比`Reject`稍微长了点，不过其中也都是些格式检查以及错误处理，在这里检查出了错误，还是要跳转到`RejectPromise`。
值得注意的是第8步到第12步，`resolution`是`Resolve`函数调用时候的参数，这里取出了它的`then`属性值，并且如果这个属性值不是函数，那么就调用`FulfillPromise`，否则的话，调用`EnqueueJob`。
很明显，只有`Promise`的实例才含有`then`的方法，那么这里的意思就是说，如果`resolution`不是`Promise`的实例，那么调用`FulfillPromise`，否则调用`EnqueueJob`。
对于第12步，这里的意思是把函数`PromiseResolveThenableJob`加入`PromiseJobs`任务队列中，并且这个函数的参数是后面`« promise, resolution, thenAction »`。这个函数内容不长，它在这里的作用其实就是把`resolve`和`reject`两个函数，调用`then`方法挂在了输入的这个`Promise`实例上。

另外，关于`EnqueueJob`，这个函数是JavaScript内部的有关任务队列的一个方法，它的作用就是把函数加入到以第一个参数为名的队列中，在这里当然就是把有关的回调函数加入到了`PromiseJobs`这个任务队列中。关于这个队列的事情，之后我再详细说明，在这里完全可以直接把它当作是`setTimeout`函数的变种，效果是类似的。

接下来再来看看`RejectPromise`：
> RejectPromise ( promise, reason )
1. Assert: The value of promise.[[PromiseState]] is "pending".
2. Let reactions be promise.[[PromiseRejectReactions]].
3. Set promise.[[PromiseResult]] to reason.
4. Set promise.[[PromiseFulfillReactions]] to undefined.
5. Set promise.[[PromiseRejectReactions]] to undefined.
6. Set promise.[[PromiseState]] to "rejected".
7. If promise.[[PromiseIsHandled]] is false, perform HostPromiseRejectionTracker(promise, "reject").
8. Return TriggerPromiseReactions(reactions, reason).

这里的描述也很简单，总之就是取出`Reject`任务队列，当前`Promise`的属性挨个清空，状态改变为`rejected`。
最后的`TriggerPromiseReactions`函数就是从任务队列中依次取出任务，然后异步运行。实际上在这个队列中的并不是回调函数，而是回调函数的运行环境；它里面不仅仅包含了回调，还包含了这个回调函数运行所需要的各种参数。所以这里运行任务还是用了个单独的函数来，这个函数叫`PromiseReactionJob`，它的内容我会在`then`章节说明，在这里大家记着这个名字就行了。

`FulfillPromise`函数的逻辑与之类似：
> FulfillPromise ( promise, value)
> 
1. Assert: The value of promise.[[PromiseState]] is "pending".
2. Let reactions be promise.[[PromiseFulfillReactions]].
3. Set promise.[[PromiseResult]] to value.
4. Set promise.[[PromiseFulfillReactions]] to undefined.
5. Set promise.[[PromiseRejectReactions]] to undefined.
6. Set promise.[[PromiseState]] to "fulfilled".
7. Return TriggerPromiseReactions(reactions, value).

同样的取出队列，清空属性，状态改变为`fulfilled`，然后回调加入任务队列异步运行。

在上面的规范中，我们能很明显的发现，这两个函数都会操作它们对应的`promise`实例，规范中这个实例是这两个函数的属性，在函数内部直接就取了出来。我在这里并没有使用这个办法，而是使用闭包将这个实例保存在了作用域中。嘛……这纯粹是个人习惯问题，两个办法效果是一样的，总之这里是需要将`promise`实例以及其对应的`resolve`和`reject`函数相互绑定。这也就是上面提过的，所谓`特殊之处`。

根据上面的描述，写出它们以及生成它们的`createResolvingFunctions`应该是不难的：
```javascript
// 创建Resolve和reject函数
function createResolvingFunctions(promise) {
	function resolve(resolution) {
		if (resolution instanceof Promise) {
			setTimeout(function () {
				resolution.then(resolve, reject);
			}, 0);
			return;
		}
		if (promise.PromiseState === 'pending') {
			const reactions = promise.PromiseFulfillReactions;

			promise.PromiseFulfillReactions = undefined;
			promise.PromiseRejectReactions = undefined;
			promise.PromiseState = 'fulfilled';
			promise.PromiseResult = resolution;

			return setTimeout(function() {
				for (let i = 0; i < reactions.length; i++) {
					promiseReactionJob(reactions[i], resolution);
				}
			}, 0);
		}
	}
	function reject(reason) {
		if (promise.PromiseState === 'pending') {
			const reactions = promise.PromiseRejectReactions;

			promise.PromiseFulfillReactions = undefined;
			promise.PromiseRejectReactions = undefined;
			promise.PromiseState = 'rejected';
			promise.PromiseResult = reason;

			return setTimeout(function() {
				for (let i = 0; i < reactions.length; i++) {
					promiseReactionJob(reactions[i], reason);
				}
			}, 0);
		}
	}

	return({
		resolve: resolve,
		reject: reject
	});
}
```

# `then`方法
主体部分完成之后，我们再来看看`then`：
> Promise.prototype.then ( *onFulfilled*, *onRejected* )
> When the **then** method is called with arguments *onFulfilled* and *onRejected*, the following steps are taken:
1. Let promise be the this value.
2. If IsPromise(promise) is false, throw a TypeError exception.
3. Let C be ? SpeciesConstructor(promise, %Promise%).
4. Let resultCapability be ? NewPromiseCapability(C).
5. Return PerformPromiseThen(promise, onFulfilled, onRejected, resultCapability).

第1步不用说，肯定是`promise = this`；
第2步`IsPromise`顾名思义就是判断它是不是`Promise`类；
第3步中使用了`SpeciesConstructor`方法，它的具体内容就不提了，它在这里的作用就是得到`Promise`的构造函数。
第4步中使用了`NewPromiseCapability`函数，这个函数内部将会先生成一个`promise`实例，然后根据这个实例再使用上面提过的`createResolvingFunctions`函数生成对应的`resolve`、`reject`函数，最后将它们三者封装到一个对象中返回。
第5步调用了`PerformPromiseThen`函数，它才是整个`then`方法的核心，来看看它的规范：
> PerformPromiseThen ( *promise*, *onFulfilled*, *onRejected*, *resultCapability* )
> 
> The abstract operation PerformPromiseThen performs the “then” operation on *promise* using *onFulfilled* and *onRejected* as its settlement actions. The result is resultCapability's promise.
> 
1. Assert: IsPromise(promise) is true.
2. Assert: resultCapability is a PromiseCapability Record.
3. If IsCallable(onFulfilled) is false, then
   1. Let onFulfilled be undefined.
4. If IsCallable(onRejected) is false, then
   1. Let onRejected be undefined.
5. Let fulfillReaction be the PromiseReaction { [[Capability]]: resultCapability, [[Type]]: "Fulfill", [[Handler]]: onFulfilled }.
6. Let rejectReaction be the PromiseReaction { [[Capability]]: resultCapability, [[Type]]: "Reject", [[Handler]]: onRejected }.
7. If promise.[[PromiseState]] is "pending", then
   1. Append fulfillReaction as the last element of the List that is promise.[[PromiseFulfillReactions]].
   2. Append rejectReaction as the last element of the List that is promise.[[PromiseRejectReactions]].
8. Else if promise.[[PromiseState]] is "fulfilled", then
   1. Let value be promise.[[PromiseResult]].
   2. Perform EnqueueJob("PromiseJobs", PromiseReactionJob, « fulfillReaction, value »).
9. Else,
   1. Assert: The value of promise.[[PromiseState]] is "rejected".
   2. Let reason be promise.[[PromiseResult]].
   3. If promise.[[PromiseIsHandled]] is false, perform HostPromiseRejectionTracker(promise, "handle").
   4. Perform EnqueueJob("PromiseJobs", PromiseReactionJob, « rejectReaction, reason »).
10. Set promise.[[PromiseIsHandled]] to true.
11. Return resultCapability.[[Promise]].

看起来很长，其实很好理解，先是对输入的两个回调`onFulfilled`和`onRejected`做格式检查，如果不是函数，那么直接忽略；然后按照当前实例的状态分别进行处理。
如果当前实例的状态是`fulfilled`，那么在队列中异步调用`PromiseReactionJob`。
对于`rejected`状态也是相似的，它也将会在异步队列中调用`PromiseReactionJob`。
如果当前实例的状态是`pending`，说明前面的任务还没有执行完毕，现在我们还不知道到底要调用哪个回调，所以我们需要将现场保存起来。这里我们将当前涉及到的回调、那个新的`promise`实例，以及它对应的`resolve`、`reject`函数全部保存到了当前`promise`实例的任务堆栈之中。 
在最后将会返回在`then`方法第四步中创建的`新`的`Promise`实例。

`PromiseReactionJob`函数就是专门用来运行任务的函数：
> **PromiseReactionJob** ( *reaction*, *argument* )
> 
> The job PromiseReactionJob with parameters *reaction* and *argument* applies the appropriate handler to the incoming value, and uses the handler's return value to resolve or reject the derived promise associated with that handler.
1. Assert: reaction is a PromiseReaction Record.
2. Let promiseCapability be reaction.[[Capability]].
3. Let type be reaction.[[Type]].
4. Let handler be reaction.[[Handler]].
5. If handler is undefined, then
   1. If type is "Fulfill", let handlerResult be NormalCompletion(argument).
   2. Otherwise, type is "Reject". Let handlerResult be Completion {[[Type]]: throw, [[Value]]: argument, [[Target]]: empty}.
6. Else, let handlerResult be Call(handler, undefined, « argument »).
7. If handlerResult is an abrupt completion, then
   1. Let status be Call(promiseCapability.[[Reject]], undefined, « handlerResult.[[Value]] »).
8. Else,
   1. Let status be Call(promiseCapability.[[Resolve]], undefined, « handlerResult.[[Value]] »).
9. Return Completion(status).

整个过程不是很复杂，简而言之就是按照回调的类型分别运行，如果回调顺利执行，那么就执行新的`Promise`的`Resolve`函数，否则执行`Reject`函数。最后返回`Resolve`或者`Reject`的状态。

至此`then`的过程就这样了，但是整个过程中有个很特别的地方。
定义`Promise`的实例需要输入一个函数，然而在使用`NewPromiseCapability`创建新的实例的时候，我们并没有为它输入任何函数。实际上这里创建的新的实例其实仅仅是个继承了`Promise`原型的空壳子对象，输入的是个空函数，它的作用是为了保证`then`方法能够链式调用。
综上所述，`then`部分的代码就可以是这样的：
```javascript
// 运行任务队列
function promiseReactionJob(reaction, argument) {
	const handler = reaction.handler,
		resolve = reaction.resolve,
		reject = reaction.reject;

	let handlerResult;
	try {
		handlerResult = handler(argument);
		resolve(handlerResult);
	} catch (e) {
		reject(e);
	}
}

// then方法
Promise.prototype.then = function (onResolved, onRejected) {
	// 如果then的参数不是函数，那么就忽略它
	onResolved = isFunction(onResolved) ? onResolved : ((v) => v);
	onRejected = isFunction(onRejected) ? onRejected : ((v) => v);

	// 封装当前运行环境
	const self = this,
		newPromise = newPromiseCapability(),
		fulfillReaction = {
			promise: newPromise.promise,
			resolve: newPromise.resolve,
			reject: newPromise.reject,
			handler: onResolved
		},
		rejectReaction = {
			promise: newPromise.promise,
			resolve: newPromise.resolve,
			reject: newPromise.reject,
			handler: onRejected
		};

	if(self.PromiseState === 'pending') {
		self.PromiseFulfillReactions.push(fulfillReaction);
		self.PromiseRejectReactions.push(rejectReaction);
	} else if (self.PromiseState === 'fulfilled') {
		setTimeout(function() {
			promiseReactionJob(fulfillReaction, self.PromiseResult);
		}, 0);
	} else if (self.PromiseState === 'resolved') {
		setTimeout(function() {
			promiseReactionJob(rejectReaction, self.PromiseResult);
		}, 0);
	}

	return(newPromise.promise);
};
```
到此为止，我们就实现了个最为简单的`Promise`，总共代码并不长，不到150行的样子。但是规范却写的很绕，有些地方语焉不详的只能靠自己猜……我尝试了很久才写成现在这个样子。完整版代码自己把上面的代码拼拼就是啦，我在这里就不贴了。

# 运行原理
代码的运行细节在上面大片大片的规范中都已经非常详细了，如果你还有些疑问，那你可以返回去再看看。下面我将以下面这段代码为例，实际讲讲我对`Promise`原理的理解，这段代码的效果很简单，就是每隔1秒顺序打印出里面的字符串。
```javascript
function delay(time, value) {
	return(new Promise(function executor(resolve) {
		setTimeout(function asyn() {
			console.log(value);
			resolve();
		}, time);
	}));
}

function log(value) {
	return function handler() {
		return delay(1000, value)
	};
}

log("start:")()
	.then(log('Step 1;'))
	.then(log('Step 2;'))
	.then(log('End.'));
```

在上面的代码中，被`promise`包裹起来的操作全都是异步运行的，这也就意味着整个操作链的建立和内部异步操作的运行是完全分离开的，所以在这里我也分成同步和异步两个部分来讲解。
为了方便讲解，上面的函数全部都是具名函数。另外我还给每个`Promise`实例进行了编号，实际做法就是在全局设置了一个名为`index`的变量，这个变量将会成为每个`Promise`实例的一个属性，并且每当创建一个新的实例，`index`都会`+1`。在`promise`运行的过程中，异步过程再加上回调函数到处跑，不标记清楚的话，你根本不知道当前运行的函数是属于哪个实例。

## 同步过程
所谓同步过程，在这里就是指主进程建立`promise`调用链的过程。从第三章我们知道每个`then`都会返回一个新的promise，而这些新的promise和原本在then之中包裹的回调在组后会变成什么样子呢？
那么，让我们从头开始。

首先是`log("start:")()`，这句很好理解，先是`log("start:")`返回了内部的`handler`函数，然后紧跟着一个括号运算符`()`，立马运行了`handler`，然后就是运行`delay(..)`返回其中的值。
`delay(..)`之中返回了个`promise`实例，这个实例的编号是`1`，为了方便，我们就叫它`promise01`吧。创建实例将会立即运行输入的函数`executor`，在这里这个函数内部只注册了个异步操作，其余啥都没有，随后就直接返回了。
所以现在的情况可以看作是这样：
```javascript
promise01
	.then(log('Step 1;'))
	.then(log('Step 2;'))
	.then(log('End.'));
```
接下来就到了第一个`then`。
在这里依旧是`log(..)`首先运行，当然它也返回了`handler`函数，为了以示区别，这个`handler`函数我们就叫它`handler01`好了。
然后`then`运行，在这之中首先调用了`newPromiseCapability`方法，创建了一个新的`promise`实例，它的编号是`2`，然后由于`promise01`的状态并未改变，依旧是等待的`pending`，所以这里的运行环境（新实例`promise02`和函数`handler01`）将会被打包并保存到`promise01`的任务队列之中。
最后，`then`方法返回了`promise02`。

接下来就都是一样的操作了，每个`then`都会返回一个新的`promise`，而后面的回调总是会连着新的`promise`实例被打包到前一个实例的任务队列之中。就这样，一个由`promise`构成的操作链表就形成了。用图片的形式我觉得会更清晰明了一点：
![Promise调用链](/img/simple-promise/promise-then-chain.png)
上面的代码中没有涉及错误捕获的过程，所以在图中我只画出了`resolve`函数，`reactions`队列特指`PromiseFulfillReactions`队列。

另外，由于`PromiseFulfillReactions`和`PromiseRejectReactions`都是数组，所以理论上每个`promise`都可以链接任意个调用链的。比如像这样：
```javascript
var start = log("start:")();

start
	.then(log1('Step 1.1;'))
	.then(log1('Step 2.2;'))
	.then(log1('End1.'));
	
start
	.then(log2('Step 2.1;'))
	.then(log2('Step 2.2;'))
	.then(log2('End2.'));
```
上面两个操作链都是链接在`start`之后的，并且由于是异步操作，所以它们之间并不会相互冲突。

## 异步过程
主进程运行完毕之后，就会等待第一个异步函数`asyn`的运行。对于现在这个例子，那就是要等待1秒，然后`asyn`函数就会运行。
```javascript
function asyn() {
	console.log(value);
	resolve();
}
```
在这个函数中先打印出了`"start:"`这个字符串，然后运行`resolve()`。
在这里`resolve()`的输入参数是空的，也就是`undefined`，所以会直接改变当前`promise`的状态，并取出任务队列中的任务，在`promiseReactionJob()`函数中异步运行。
当前任务运行完毕之后主进程也随之完毕，再次进入异步进程，也就是`promiseReactionJob`中运行刚才取出的所有任务。
在这个函数中，会首先运行环境中保存的回调，在这里这个回调就是`handler01`，在这个回调之中会运行`delay()`函数，它将新建`promise`，这个新实例的编号是`6`，并且会同时注册新的异步函数`asyn`。在回调结束之后，将会运行`resolve()`函数，而此时它会有一个参数，那就是刚刚返回的`promise06`。
好了，现在问题来了，现在马上就要运行的这个`resolve()`，是和哪个实例绑定的？

答案是`promise02`。

`promise06`当然是`Promise`的实例，所以将会运行`resolve`中的这段：
```javascript
setTimeout(function () {
	promise06.then(promise02.resolve, promise02.reject);
}, 0);
```
`promise02`中还存着后面的`handler`回调呢，当然不能就这么销毁了，那么就把它链接到这个新的`promise06`之中，这就是这里这个`then`的意义。当然，这个`then`也会生成一个新的`promise`，这个新实例的编号是`7`，但是它的后面什么都没有，只是个空的。并且需要注意的是，在`then`中的回调是`promise02`的`resolve`和`reject`函数，这样就意味着运行`promise07`的回调就会直接改变`promise02`的状态。所以，整个调用链变成了如下的模样：
![异步过程中的调用链 一](/img/simple-promise/promise-then-chain-asyn-01.png)

好了，现在只需要等着下一步异步操作运行。
又等待了1秒，`promise06`的异步操作运行了。它打印出了`"Step 1;"`，然后运行它的`resolve()`。当然又是取出任务队列异步运行任务，和前面的过程一样，这里马上就会开始运行`promise07`的回调。而在上面也说了，经过了前面的`then`操作，现在`promise07`的回调实际上就是`promise02`的`resolve`。
当`promise02`的`resolve`运行，就会取出`promise03`的回调并运行。同样的，这里会创建`promise08`和`promise09`，它们的过程和上面一样，就不再多说了。
当`promise07`的回调运行完毕，也就是意味着新的调用链已经创建完毕，根据流程还会调用`promise07`的`resolve`函数，`promise07`的队列中是空的，所以这里只会改变它自己的状态，然后就什么都没有了。
经过这些操作之后，新的调用链就变成了这样：
![异步过程中的调用链 二](/img/simple-promise/promise-then-chain-asyn-02.png)
之后的操作就都是重复上面的过程了，在这里就不再多说了。

## 小测验
经过了上述的讲解，相信你对`promise`的运行过程已经有了一定程度的理解。那么我在这里出几个问题，顺着上面的思路和代码想想它们是如何运行的吧。
```javascript
function doSomething() {
    console.log('doSomething(): start');
    return new Promise(function (resolve) {
        setTimeout(function () {
            console.log('doSomething(): end');
            resolve();
        }, 1000);
    });
}

function doSomethingElse() {
    console.log('doSomethingElse(): start');
    return new Promise(function (resolve) {
        setTimeout(function () {
            console.log('doSomethingElse(): end');
            resolve();
        }, 1000);
    });
}

//# 1
doSomething().then(function () {
    return doSomethingElse();
});

//# 2
doSomething().then(function () {
    doSomethingElse();
});

//# 3
doSomething().then(doSomethingElse());

//# 4
doSomething().then(doSomethingElse);
```

# `EnqueueJob`
如果你还记得的话，其实在上面的讲解中，还有个东西我没说过——`Promise`异步操作专用的任务队列函数`EnqueueJob`。虽然在上面我说它和`setTimeout`的效果是类似的，在这里我们确实也是用`setTimeout`来代替它的，但其实深究起来这俩的区别还是挺大的。

先来看看下面的代码：
```javascript
var start = +new Date();
var index = 0;
(function foo() {
    setTimeout(function() {
		index ++;
		if((+new Date) - start < 1000) {
			foo()
		} else {
			console.log(index);
		}
	}, 0)
}());
```
上面这段测试用的代码就是在1秒的时间内不断运行`setTimeout`，最后打印出运行次数。不同的电脑、浏览器可能结果有些不同，在我的电脑中的结果是`244`左右。这也就意味着，在这1秒中一共运行了244次`setTimeout`函数，平均每次大概花费了`4ms`左右的时间。
单单`4ms`的时间间隔不是什么大问题，但是如果你的调用链足够长，再加上你的异步操作本身需要的时间，这个时间累积起来是很有可能造成影响的。对于网页应用而言，顶多页面卡顿片刻，但是如果是在服务器端的node，这点时间可能就会造成严重的后果。

至于造成这个现象的原因，其实不是什么深刻难懂的技术问题，而是因为——**这是规范规定的**。
> Timers can be nested; after five such nested timers, however, the interval is forced to be at least **four milliseconds**.

`setTimeout`是属于`window`的内容，不属于js语言规范，所以在ECMA中是查不到的，上面的引用是它在HTML5规范中的规定。可以看到，规范中直接指明了定时器的最短时间间隔就是`4ms`。

而对于原生的`Promise`来说就没有这个问题了，原生的`Promise`使用的是`EnqueueJob`这个专门的函数来操作异步队列，它是没有这个延迟的。如果你对这还是有点疑虑的话，我们可以尝试测量一下原生`Promise`的队列间隔。
`EnqueueJob`函数是js规范内部的抽象函数，我们在外部是无法操作它的，但是我们可以构造出一个极为简单但是却非常长的调用链来，这样就能间接的对它进行测量。比如像下面的代码这样：
```JavaScript
console.time("Testing with promise");
let next = new Promise(function(res) {
		res();
	});
for(let i = 0; i < 1000; i++) {
	next = next.then(function () {
		return new Promise(function (res) {
			res();
		});
	});
}
next.then(function () {
	console.timeEnd("Testing with promise");
});
```
在上面的代码中，我们建立了个长达1000个`then`的调用链，每个`then`内部都没有异步操作，最开始的`next`已经处于`fulfilled`状态，之后的第一个`then`会直接调用`promiseReactionJob`运行回调，但这个回调是异步运行的，这个新生成的`promise`会停留在`pending`状态中，随后的`then`就会和上面讲解过的流程一样构建调用链，等待异步操作。按照规范，每个`then`总共有三个异步操作：
1. `then`之中执行回调
2. 生成新的`promise`实例链接到当前调用链
3. 改变当前`promise`状态取出内部存着的回调并运行（虽然在这个例子中内部什么都没有）

那么总共就有3000个异步操作，原生的和`setTimeout`的差距是非常显著的：
```JavaScript
//原生
"Testing with promise: 45.292ms"

//我们自己实现
"Testing with promise: 12446.450ms"
```
使用`setTimeout`的`Promise`一共用了12秒左右，这和规范中`4ms`的限定是相符的；而原生的只花了`45ms`，这也就意味着`EnqueueJob`的延迟只有`15μs`。对于浏览器来说，这几乎就等于没有延迟了。

所以`setTimeout`是无法达到完全无延迟的异步操作。如果你在使用诸如我这里这样用`setTimeout`实现的`Promise`，那你就需要特别小心这一点。

# 总结
`Promise`解决的不仅仅是缩进的问题，更为重要的是它提供了更加安全的反转控制机制，我们终于能和和线性编程一样，随意控制异步编程的流程了，我在使用过几次之后也能体会到它带来的爽快感。

但是相对的，我也不得不承认Promise并不是完美的。虽然它的确比回调模式要好，但是这就好像是二十步比百步的感觉，它的确是略有优势，但是如果我有选择，我会选择`python`的`async/await`（笑。
即便我花了很长时间自己实现了它，并写下了这篇文章，我现在依然觉得它难以理解并且容易误用。虽然它已经尽力去贴近线性编程的代码模式，但是我在使用中也不得不一再对自己强调这是`异步`的，这和同步不一样……这让我觉得比较痛苦。

即便我有这么多牢骚，在等待ES7的日子里，`promise`依旧是我们必须掌握的工具之一。
但是我觉得我们也可以换个角度来看待这件事情，理解某个困难的知识点，学习到某个新奇的知识，甚至只是`promise`这样奇怪的控制思路，这些东西本身不也能让人感到高兴吗。