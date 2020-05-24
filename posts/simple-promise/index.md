---
title: “简单”的 Promise
date: 2016-10-20
tag: JavaScript,规范,异步
description: 看了看 ES 规范，尝试自己实现了简单的 Promise，本文就是个人对于 Promise 的笔记。
---

如果你对*Promise*不太了解，我建议你先去看看它是如何使用的：[ES6 入门 - Promise](http://es6.ruanyifeng.com/#docs/promise)。本文虽然是参考了规范，但并不是完全按照规范的步骤来进行实现的。规范中为了兼容各种情况，有着大量的类型、状态、格式检查，本文只为了展示原理，所以代码只会保留最低限度的错误检查。{.warning}

# 简述
在这里我们只考虑实现一个最为简单的*Promise*类，它只有构造函数本身以及*then*方法。

*Promise*最为常见的用法就是将异步方法用*then*链式调用串联到一起，既然是这样的结构，那么很明显*then*方法最后必定会返回*Promise*类。既然它主要是用于处理异步编程时候的回调问题，那么在处理链式调用的时候必定会先把所有的异步回调按照顺序存起来，然后在某个时间点取出运行。
这么说起来，似乎它的运行方式和其他涉及异步的库很像，都是类似的手工管理堆栈的编程方式。不过不一样的地方就是在于，它取出回调并运行之的契机是在于前一个*Promise*的状态。
这样的话，它的结构就并不是纯粹的堆栈了，它更像是链表，从第一个*Promise*开始，每个*then*都会返回一个新的*Promise*，它们一环套一环将所有的回调串联了起来。

*Promise*是异步函数，所以不要陷入同步运行的思维定势之中，尤其不要把回调和*Promise*本身混淆了，把回调当作是普通的参数就行了。*Promise*本身只是起着将回调串联起来的任务，回调函数的运行在绝大部分情况下和*Promise*本身并不是同步的。{.note}

有了上述的感性认识，下面我们就来实现一个*Promise*吧。

# 构造函数
按照`ES6`的规范，构造*Promise*类的实例是下面这样的：

```javascript
const promise = new Promise(function(resolve, reject) {
    // code..

    if (/* 异步操作成功 */){
        resolve(value);
    }
    else {
        reject(error);
    }
});
```

所以，我们使用通用的构造函数方式来构建*Promise*类就行了：

```javascript
class Promise {
    constructor(executor) {
        // code..
    }

    then(resolve, reject) {
        // code..
    }
}
```

那么，接下来就要搬出规范了，来看看规范对于`Promise`的构造函数是如何描述的：
> **Promise** ( *executor* )
> 
> When the Promise function is called with argument *executor*, the following steps are taken:
> 1. If NewTarget is undefined, throw a TypeError exception.
> 2. If IsCallable(executor) is false, throw a TypeError exception.
> 3. Let promise be ? OrdinaryCreateFromConstructor(NewTarget, "%PromisePrototype%", « [[PromiseState]], [[PromiseResult]], [[PromiseFulfillReactions]], [[PromiseRejectReactions]], [[PromiseIsHandled]] »).
> 4. Set promise.[[PromiseState]] to "pending".
> 5. Set promise.[[PromiseFulfillReactions]] to a new empty List.
> 6. Set promise.[[PromiseRejectReactions]] to a new empty List.
> 7. Set promise.[[PromiseIsHandled]] to false.
> 8. Let resolvingFunctions be CreateResolvingFunctions(promise).
> 9. Let completion be Call(executor, undefined, « resolvingFunctions.[[Resolve]], resolvingFunctions.[[Reject]] »).
> 10. If completion is an abrupt completion, then
> 11. Perform ? Call(resolvingFunctions.[[Reject]], undefined, « completion.[[Value]] »).
> 12. Return promise.

我们挨着解释，`NewTarget`就是指`this`，当它等于`undefined`的时候抛出类型错误，什么时候`this`会等于`undefined`？使用构造函数的时候忘了用`new`就会这样。
`IsCallable`方法是判断输入函数是否能够被调用，这是规范中内部的抽象方法，我们实际中可以直接判断它是不是函数就行了。
第3步就是创造当前实例的内部属性，我们在这里简化操作，就直接将这些属性挂在对象内部了。4、5、6、7都是属性赋值，不多说。
第8步使用`CreateResolvingFunctions`方法返回了一个对象，这个对象内部包含了`Promise`中的`Resolve`和`Reject`函数。这里创建出来的两个函数非常`特殊`，至于它们特殊在哪里，我先卖个关子，之后再告诉大家。
第9、10、11步是把生成的`Resolve`和`Reject`函数当作参数输入`executor`，并运行`executor`。如果运行出错，那么直接运行`Reject`。
最后返回当前对象。
