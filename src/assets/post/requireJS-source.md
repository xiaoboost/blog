title: requireJS源码浅析
category: 软件设计
date: 2016-03-17
tag: [JavaScript,requireJS,异步]
layout: post
toc: true

---

初次使用requireJs的时候有很多不甚明了的地方，于是乎就有了看看源码的心思，再加上它的代码加上注释也不过2000+行，而且注释又非常详尽，看起来貌似不怎么困难……我看之前是这么想的……结果发现其实很难……但是半途而废感觉又不太好，还是硬着头皮看了几遍，很多细节问题吃不透，只能理解个大概，本文是我自己的笔记，如果有错误还请指正。另外，本文看着很长，其实有大半都是源码的复制黏贴，水得很……
<!--more-->

# 初始化
## 主程序入口
阅读源码首先当然是寻找程序入口，`requireJS`模块的入口便是引用它本身的`<script>`标签。
```html
<script src="require.js" data-main="lib/main.js">
```

Js文件引入之后，模块本身就会被加载，先来看看模块初始化的时候做了什么。
requireJS模块的整体结构是一个立即执行函数和3个全局变量：
```javascript
var requirejs, require, define;
(function (global) {……}(this));
```

立即执行函数的输入参数是`this`，全局运行的时候this肯定是指向`window`的，那么这个立即执行函数的`global`就是`window`。
由入口进入之后定义了一大堆变量方法，然后来到了这里，做了第一件事：
```javascript
//Create default context.
req({});
```

## 初次运行入口函数
`req({})`就是初次运行的入口函数，它的函数原型是：
```javascript
req = requirejs = function (deps, callback, errback, optional) {｝
```

初次运行输入参数是一个空对象，里面的代码只有两句有效（这里就不贴源码了，源码在后面）：
```javascript
if (!context) {
  context = contexts[contextName] = req.s.newContext(contextName);
}
if (config) {
  context.configure(config);
}
```

初次运行context是空值，将会运行`newContext()`方法，这个方法很特殊，它只会在初始化的时候运行一次，之后便不会再运行了，但它的代码洋洋洒洒占据了全部代码的三分之二。
这个方法会不仅是属性参数的初始化，还会创建并在之后持续维护一个闭包，这个闭包保存了几个临时变量。此方法运行没有什么特别的代码，就是一堆工具函数和变量的定义，完成初始化之后，立刻就用空的配置调用了`context.configure`方法初始化了`shim`和`path`等参数。这里面的函数方法之后碰到了再详细说，现在挨个说了也记不住，先找找`data-main`的处理函数。

## 记录用户主程序路径
再往后就能看到处理`data-main`相关的逻辑了，代码是这样的：
```javascript
//Look for a data-main script attribute, 
// which could also adjust the baseUrl.
if (isBrowser && !cfg.skipDataMain) {
  //Figure out baseUrl. Get it from the script tag with require.js in it.
  eachReverse(scripts(), function (script) {
    //Set the 'head' where we can append children by
    //using the script's parent.
    if (!head) {
      head = script.parentNode;
    }

    //Look for a data-main attribute to set main script for the page
    //to load. If it is there, the path to data main becomes the
    //baseUrl, if it is not already set.
    dataMain = script.getAttribute('data-main');
    if (dataMain) {
      //Preserve dataMain in case it is a path (i.e. contains '?')
      mainScript = dataMain;

      //Set final baseUrl if there is not already an explicit one,
      //but only do so if the data-main value is not a loader plugin
      //module ID.
      if (!cfg.baseUrl && mainScript.indexOf('!') === -1) {
        //Pull off the directory of data-main for use as the
        //baseUrl.
        src = mainScript.split('/');
        mainScript = src.pop();
        subPath = src.length ? src.join('/')  + '/' : './';

        cfg.baseUrl = subPath;
      }

      //Strip off any trailing .js since mainScript is now
      //like a module name.
      mainScript = mainScript.replace(jsSuffixRegExp, '');

      //If mainScript is still a path, fall back to dataMain
      if (req.jsExtRegExp.test(mainScript)) {
        mainScript = dataMain;
      }

      //Put the data-main script in the files to load.
      cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [mainScript];

      return true;
    }
  });
}
```

因为`requireJS`不止用于浏览器，所以在入口处有一个判断，如果当前是浏览器那么`isBrowser = true`，后面那个暂且不管它。进入之后有一个名为`eachReverse`的方法，它将会逆序遍历传入的第一个参数，而第一个参数是：
```javascript
scripts() => document.getElementsByTagName('script');
```

这里返回了页面中的所有script标签，然后逆序遍历之。这一段代码的含义就是寻找拥有`data-main`属性的标签，并记录主程序入口文件的路径并记录。
就以我们章节开头的那个标签为例，这里将会保存为——
```javascript
cfg = {
  baseUrl = "lib/",
  deps = ["main"]
}
```

`cfg.baseUr1`将会保存基础路径，`cfg.deps`将会保存入口文件名。同时`baseUrl`这个属性会被记录到`require.config`中，也就是说如果后续不更改基础路径属性的话，就会默认`data-main`的目录了。

## 第二次运行入口函数
好了，程序入口已经找到，进入下一个步骤。之后将会再一次运行入口函数，上一次运行入口函数只是初始化，这一次将`cfg`作为参数传入了。
```javascript
//Set up with config info.
req(cfg);
```

入口函数`req`的代码如下：
```javascript
req = requirejs = function (deps, callback, errback, optional) {

  //Find the right context, use default
  var context, config,
    contextName = defContextName;

  // Determine if have config object in the call.
  if (!isArray(deps) && typeof deps !== 'string') {
    // deps is a config object
    config = deps;
    if (isArray(callback)) {
      // Adjust args if there are dependencies
      deps = callback;
      callback = errback;
      errback = optional;
    } else {
      deps = [];
    }
  }

  if (config && config.context) {
    contextName = config.context;
  }

  context = getOwn(contexts, contextName);
  if (!context) {
    context = contexts[contextName] = req.s.newContext(contextName);
  }

  if (config) {
    context.configure(config);
  }

  return context.require(deps, callback, errback);
};
```

调用`context.configure(config)`保存了输入的`deps`参数之后，再调用`require`。
之后几个函数来回回调，实际上最后调用的是个名叫`localRequire`的方法，这个方法的源码是这样的：
```javascript
function localRequire(deps, callback, errback) {
  var id, map, requireMod;

  if (options.enableBuildCallback && callback && isFunction(callback)) {
    callback.__requireJsBuild = true;
  }

  if (typeof deps === 'string') {
    if (isFunction(callback)) {
      //Invalid call
      return onError(
        makeError(
          'requireargs', 
          'Invalid require call'
        ),
      errback);
    }

    //If require|exports|module are requested, get the
    //value for them from the special handlers. Caveat:
    //this only works while module is being defined.
    if (relMap && hasProp(handlers, deps)) {
      return handlers[deps](registry[relMap.id]);
    }

    //Synchronous access to one module. If require.get is
    //available (as in the Node adapter), prefer that.
    if (req.get) {
      return req.get(context, deps, relMap, localRequire);
    }

    //Normalize module name, if it contains . or ..
    map = makeModuleMap(deps, relMap, false, true);
    id = map.id;

    if (!hasProp(defined, id)) {
      return onError(makeError('notloaded', 'Module name "' +
        id +
        '" has not been loaded yet for context: ' +
        contextName +
        (relMap ? '' : '. Use require([])')));
    }
    return defined[id];
  }

  //Grab defines waiting in the global queue.
  intakeDefines();

  //Mark all the dependencies as needing to be loaded.
  context.nextTick(function () {
    //Some defines could have been added since the
    //require call, collect them.
    intakeDefines();

    requireMod = getModule(makeModuleMap(null, relMap));

    //Store if map config should be applied to this require
    //call for dependencies.
    requireMod.skipMap = options.skipMap;

    requireMod.init(deps, callback, errback, {
      enabled: true
    });

    checkLoaded();
  });

  return localRequire;
}
```

当`deps`是字符串的情况下，这个`if`里面的东西那先不管，直接看下面。`intakeDefines()`，这个会将两个全局队列清空，这两个全局队列保存的是当前已经引用的全部依赖模块，在调用运行函数的时候会把它们取出，现在里面什么都没有，这里是没什么用的。
接下来就是重头戏了，`nextTick()`方法实际上是一个延迟函数，源码在这里：
```javascript
/**
 * Execute something after the current tick
 * of the event loop. Override for other envs
 * that have a better solution than setTimeout.
 * @param  {Function} fn function to execute later.
 */
req.nextTick = typeof setTimeout !== 'undefined' ? function (fn) {
  setTimeout(fn, 4);
} : function (fn) { fn(); };
```

可以看出默认异步延迟了4毫秒，从时间顺序上来说这个异步函数的内容是最后才会运行的。
它的内容很简单，那就是找出输入的`Module`，在网页上加载这个`module`的`script`标签，值得注意的是加载这个标签是异步的。

## 加载用户主程序
延迟函数中的程序很简单，只有几句话，首先`intakeDefines()`，取出载入的模块。然后紧接着就是`getModule(makeModuleMap(null, relMap))`。
先说`makeModuleMap`，它会按照一定的规则生成一个独一无二的对象，规则的具体细节就不说了。然后是`getModule()`，之所以先定义再直接取出是因为要把生成的对象加入到`registry`这个全局变量中，`getModule`的源码很短：
```javascript
function getModule(depMap) {
  var id = depMap.id,
    mod = getOwn(registry, id);

  if (!mod) {
    mod = registry[id] = new context.Module(depMap);
  }

  return mod;
}
```

**这里能看出预先加载过的模块，之后就不用重新加载了。**
接下来配置取出的`Moudle`，`deps`存着入口程序的地址。`init()`方法很明显是初始化：
```javascript
Module.prototype.init = function (depMaps, factory, errback, options) {
  options = options || {};
  //Do not do more inits if already done. Can happen if there
  //are multiple define calls for the same module. That is not
  //a normal, common case, but it is also not unexpected.
  if (this.inited) {
    return;
  }
  this.factory = factory;
  if (errback) {
    //Register for errors on this module.
    this.on('error', errback);
  } else if (this.events.error) {
    //If no errback already, but there are error listeners
    //on this module, set up an errback to pass to the deps.
    errback = bind(this, function (err) {
      this.emit('error', err);
    });
  }
  //Do a copy of the dependency array, so that
  //source inputs are not modified. For example
  //"shim" deps are passed in here directly, and
  //doing a direct modification of the depMaps array
  //would affect that config.
  this.depMaps = depMaps && depMaps.slice(0);
  this.errback = errback;
  //Indicate this module has be initialized
  this.inited = true;
  this.ignore = options.ignore;
  //Could have option to init this module in enabled mode,
  //or could have been previously marked as enabled. However,
  //the dependencies are not known until init is called. So
  //if enabled previously, now trigger dependencies as enabled.
  if (options.enabled || this.enabled) {
    //Enable this module and dependencies.
    //Will call this.check()
    this.enable();
  } else {
    this.check();
  }
}
```

这里前面主要是根据实例的内部参数配置参数，关键是最后那个`if`，假如输入参数`option.enabled = true`，那么就会直接调用`this.enable()`，这个方法主要是一些错误检查，无误之后将会跳转到`this.fetch()`方法，源码：
```javascript
Module.prototype.fetch = function () {
  if (this.fetched) {
    return;
  }
  this.fetched = true;

  context.startTime = (new Date()).getTime();

  var map = this.map;

  //If the manager is for a plugin managed resource,
  //ask the plugin to load it now.
  if (this.shim) {
    context.makeRequire(this.map, {
      enableBuildCallback: true
    })(this.shim.deps || [], bind(this, function () {
      return map.prefix ? this.callPlugin() : this.load();
    }));
  } else {
    //Regular dependency.
    return map.prefix ? this.callPlugin() : this.load();
  }
}
```

这里值得注意的是，有一个`prefix`的参数，这个是当前模块的前置依赖，要是它存在，那么会先加载那个模块，然后再加载当前模块。
初次调用肯定是不存在的，那么将会继续跳转至`this.load()`，这里面将会把马上就要载入模块的名字和路径当作参数继续跳转，然后将会到达`req.load(context, id, url)`方法，源码很长，但其实都是一些浏览器的兼容处理，最后将会调用`node = req.createNode(config, moduleName, url)`添加标签。你以为完了吗？还没有呢，之后会马上给标签绑定上两个事件：
```javascript
node.addEventListener('load', context.onScriptLoad, false);
node.addEventListener('error', context.onScriptError, false);
```

一个在加载完成后，一个在加载出错时。
前者是读取新添加脚本的内容，后者是抛出加载错误的异常。

## 加载检查
当然，不是说添加了`script`标签就完了，肯定要监控脚本是否正常加载了。所以有一个加载检查的函数`checkLoaded()`，虽然源码很长，但是功能挺简单，就不贴代码了，其功能就是间隔50毫秒的异步轮询，如果没有成功加载那么继续监控，如果超过一定时间还未成功，那么就要抛出超时错误。
至此，终于理顺了初始化过程，对整个 `requirejs`模块的大致解构也有了点初步的了解，接下来看看对外暴露的几个方法。

# require.config
这个方法会直接调用内部的`req.config()`方法，而后进一步调用`reg()`，将参数保存至内部`context`。但是我比较疑惑的就是它仍然会`require`本身，并制作`Module`，甚至于后面的异步调用都有参与，虽然说是空的`Moudle`，并且未计入全局`Module`列表中，但是程序如此设计不是多此一举吗？

# require
其实在`requirejs`本身初始化的过程中就是使用这个命令，它不过是将自己作为了一个特殊的模块，初始化首先处理了自己本身的属性，然后`require`了它自己。
先来介绍一下内部用于保存模块的类——`Module`。
## `Module`类
这个类是`requirejs`内部自己定义的类，用于保存依赖的模块，它的原型是这样的：
```javascript
Module = function (map) {
  this.events = getOwn(undefEvents, map.id) || {};
  this.map = map;
  this.shim = getOwn(config.shim, map.id);
  this.depExports = [];
  this.depMaps = [];
  this.depMatched = [];
  this.pluginMaps = {};
  this.depCount = 0;

  /* this.exports this.factory
   this.depMaps = [],
   this.enabled, this.fetched
   */
}
```

每一个依赖都有很多状态，比如`loading`, `enabling`, `defining`，即加载模块文件，使能该模块（运行模块内部的`define`），最后是正在运行`callback`。
当新建一个模块之后就会立刻运行`init()`，然后根据不同的配置和状态转向不同的方法，比如当前模块的依赖还没有加载，那么就会转向`enable()`，如果依赖加载完毕，那就会转向`check()`，如果状态变成了`defined`，就表示整个模块都运行完了（包括输入的回调）。
这些状态在初始化的时候并未定义，只有在下面的各个方法中可以看到。

## 具体过程
对于外部使用而言，其过程和`data-main`初始化大同小异，在这里再稍微提一下。
对外暴露的`require`会直接调用`req()`方法，根据规则跳过中间那么多处理之后，会转入`localRequire()`，在其中啥事儿没干，就是定义了那个`nextTick()`的异步函数。
从时间顺序上来讲，脚本读取完成之后将会触发添加脚本时候添加的`load`事件，对于`require`事件而言，也啥都没干……进去跑了一圈就出来了。所以这里也不贴源码了，在`define`有详细介绍。
间隔几个毫秒之后就是`nextTick()`异步函数，这才是主要的，异步函数中最主要的就是以`enabled: true`为参数初始化，即执行`init()`方法。如果`require`内部有依赖，那么将会保存当前数据，并紧接着去加载它的依赖，有关这一点之后再讲，现在假设没有任何依赖或者说依赖已经加载完成了，有没有完成加载依赖的主要区别都在`Module.check()`函数中，它的源码：
```javascript
/**
 * Checks if the module is ready to define itself, and if so,
 * define it.
 */
Module.prototype.check = function () {
  if (!this.enabled || this.enabling) {
    return;
  }

  var err, cjsModule,
    id = this.map.id,
    depExports = this.depExports,
    exports = this.exports,
    factory = this.factory;

  if (!this.inited) {
    // Only fetch if not already in the defQueue.
    if (!hasProp(context.defQueueMap, id)) {
      this.fetch();
    }
  } else if (this.error) {
    this.emit('error', this.error);
  } else if (!this.defining) {
    //The factory could trigger another require call
    //that would result in checking this module to
    //define itself again. If already in the process
    //of doing that, skip this work.
    this.defining = true;

    if (this.depCount < 1 && !this.defined) {
      if (isFunction(factory)) {
        //If there is an error listener, favor passing
        //to that instead of throwing an error. However,
        //only do it for define()'d  modules. require
        //errbacks should not be called for failures in
        //their callbacks (#699). However if a global
        //onError is set, use that.
        if ((this.events.error && this.map.isDefine) ||
          req.onError !== defaultOnError) {
          try {
            exports = context.execCb(id, factory, depExports, exports);
          } catch (e) {
            err = e;
          }
        } else {
          exports = context.execCb(id, factory, depExports, exports);
        }

        // Favor return value over exports. If node/cjs in play,
        // then will not have a return value anyway. Favor
        // module.exports assignment over exports object.
        if (this.map.isDefine && exports === undefined) {
          cjsModule = this.module;
          if (cjsModule) {
            exports = cjsModule.exports;
          } else if (this.usingExports) {
            //exports already set the defined value.
            exports = this.exports;
          }
        }

        if (err) {
          err.requireMap = this.map;
          err.requireModules = this.map.isDefine ? [this.map.id] : null;
          err.requireType = this.map.isDefine ? 'define' : 'require';
          return onError((this.error = err));
        }

      } else {
        //Just a literal value
        exports = factory;
      }

      this.exports = exports;

      if (this.map.isDefine && !this.ignore) {
        defined[id] = exports;

        if (req.onResourceLoad) {
          var resLoadMaps = [];
          each(this.depMaps, function (depMap) {
            resLoadMaps.push(depMap.normalizedMap || depMap);
          });
          req.onResourceLoad(context, this.map, resLoadMaps);
        }
      }

      //Clean up
      cleanRegistry(id);

      this.defined = true;
    }

    //Finished the define stage. Allow calling check again
    //to allow define notifications below in the case of a
    //cycle.
    this.defining = false;

    if (this.defined && !this.defineEmitted) {
      this.defineEmitted = true;
      this.emit('defined', this.exports);
      this.defineEmitComplete = true;
    }

  }
}
```

如果说依赖没有加载完，那么当前`Module`对象必然有`inited = undefined`，所以就会转入`Module.fetch()`方法中去加载依赖，当`inited = true`，那么表示当前`Module`对象加载完成了，可以执行回调，那么将会把参数一股脑传入`context.execCb`函数中，这个函数很短：
```javascript
execCb: function (name, callback, args, exports) {
    return callback.apply(exports, args);
}
```

可以看到，这里就会执行回调了。

# `define`
再来说说`define`，它的源码其实并不长：
```javascript
define = function (name, deps, callback) {
	var node, context;

	//Allow for anonymous modules
	if (typeof name !== 'string') {
		//Adjust args appropriately
		callback = deps;
		deps = name;
		name = null;
	}

	//This module may not have dependencies
	if (!isArray(deps)) {
		callback = deps;
		deps = null;
	}

	//If no name, and callback is a function, then figure out if it a
	//CommonJS thing with dependencies.
	if (!deps && isFunction(callback)) {
		deps = [];
		//Remove comments from the callback string,
		//look for require calls, and pull them into the dependencies,
		//but only if there are function args.
		if (callback.length) {
			callback
				.toString()
				.replace(commentRegExp, commentReplace)
				.replace(cjsRequireRegExp, function (match, dep) {
					deps.push(dep);
				});

			//May be a CommonJS thing even without require calls, but still
			//could use exports, and module. Avoid doing exports and module
			//work though if it just needs require.
			//REQUIRES the function to expect the CommonJS variables in the
			//order listed below.
			deps = (callback.length === 1 ? ['require'] : 
				['require', 'exports', 'module']).concat(deps);
		}
	}

	//If in IE 6-8 and hit an anonymous define() call, do the interactive
	//work.
	if (useInteractive) {
		node = currentlyAddingScript || getInteractiveScript();
		if (node) {
			if (!name) {
				name = node.getAttribute('data-requiremodule');
			}
			context = contexts[node.getAttribute('data-requirecontext')];
		}
	}

	//Always save off evaluating the def call until the script onload handler.
	//This allows multiple modules to be in a file without prematurely
	//tracing dependencies, and allows for anonymous module support,
	//where the module name is not known until the script onload event
	//occurs. If no context, use the global queue, and get it processed
	//in the onscript load callback.
	if (context) {
		context.defQueue.push([name, deps, callback]);
		context.defQueueMap[name] = true;
	} else {
		globalDefQueue.push([name, deps, callback]);
	}
}
```

脚本加载完成之后，就会读取脚本的内容，碰到`define`命令就会运行这里的代码，可以看出`define`命令仅仅是做了很多兼容处理，然后就将所有信息暂存进了两个全局队列。在这里有一处值得注意，就是对`callback`的正则处理，`callback`转为字符串之后连续两次调用`replace()`方法，其中的正则是这样的：
```javascript
commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/;
mgcjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g;
```

上面那个看名字都能看出是匹配代码中的所有注释，后者则是匹配了`require(/*code*/)`这样的结构，并将`require()`内的内容存了起来。很明显了，这里肯定是此模块的依赖，当然要先存起来等待之后加载的。脚本一旦读取完成，就会触发当初添加脚本时候添加的`load`事件，`context.onScriptLoad()`，此事件的源码并不长功能也简单，先是移除了开始给脚本绑定的那两个事件，随后调用了`context.completeLoad()`方法，后者的源码：
```javascript
completeLoad: function (moduleName) {
	var found, args, mod,
		shim = getOwn(config.shim, moduleName) || {},
		shExports = shim.exports;

	takeGlobalQueue();

	while (defQueue.length) {
		args = defQueue.shift();
		if (args[0] === null) {
			args[0] = moduleName;
			//If already found an anonymous module and bound it
			//to this name, then this is some other anon module
			//waiting for its completeLoad to fire.
			if (found) {
				break;
			}
			found = true;
		} else if (args[0] === moduleName) {
			//Found matching define call for this script!
			found = true;
		}

		callGetModule(args);
	}
	context.defQueueMap = {};

	//Do this after the cycle of callGetModule in case the result
	//of those calls/init calls changes the registry.
	mod = getOwn(registry, moduleName);

	if (!found && !hasProp(defined, moduleName) && mod && !mod.inited) {
		if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
			if (hasPathFallback(moduleName)) {
				return;
			} else {
				return onError(makeError('nodefine',
					'No define call for ' + moduleName,
					null,
					[moduleName]));
			}
		} else {
			//A script that does not call define(), so just simulate
			//the call for it.
			callGetModule([moduleName, (shim.deps || []), shim.exportsFn]);
		}
	}

	checkLoaded();
}
```

很明显，这里先取出了之前读取文件内容后保存在全局队列中相关的记录，然后调用了`callGetModule()`，它的代码是这样的：
```javascript
function callGetModule(args) {
    //Skip modules already defined.
    if (!hasProp(defined, args[0])) {        
		getModule(
			makeModuleMap(args[0], null, true)).init(args[1], args[2]
		);    
	}
}
```

很眼熟吧，在`require`的那个异步函数中也有这么一段，这一段的意思注释也说的很清楚了，就是如果`defined`中已经存了当前模块的信息，说明之前已经加载过啦，就跳过，如果还没有，那就新建一个，并且将之初始化，这个初始化的方法`init()`，在上面也提过了不多讲。

# 依赖的依赖
在平时的使用中，依赖本身还包含了别的依赖也是很常见的情况。对于这种情况无论是`define`还是`require`处理过程都是一样的，毕竟两个模块都是以`init()`为入口的，所以这里就放在一起讲了。
还是从`init()`开始，之后将会跳转到`enable()`方法，没有依赖的时候，`enable()`方法几乎不做任何处理就直接跳转到了`check()`方法。
这里我们当然假设是有依赖的，那么看它的源码：
```javascript
Module.prototype.enable = function () {
	enabledRegistry[this.map.id] = this;
	this.enabled = true;

	//Set flag mentioning that the module is enabling,
	//so that immediate calls to the defined callbacks
	//for dependencies do not trigger inadvertent load
	//with the depCount still being zero.
	this.enabling = true;

	//Enable each dependency
	each(this.depMaps, bind(this, function (depMap, i) {
		var id, mod, handler;

		if (typeof depMap === 'string') {
			//Dependency needs to be converted to a depMap
			//and wired up to this module.
			depMap = makeModuleMap(depMap,
				(this.map.isDefine ? this.map : this.map.parentMap),
				false,
				!this.skipMap);
			this.depMaps[i] = depMap;

			handler = getOwn(handlers, depMap.id);

			if (handler) {
				this.depExports[i] = handler(this);
				return;
			}

			this.depCount += 1;

			on(depMap, 'defined', bind(this, function (depExports) {
				if (this.undefed) {
					return;
				}
				this.defineDep(i, depExports);
				this.check();
			}));

			if (this.errback) {
				on(depMap, 'error', bind(this, this.errback));
			} else if (this.events.error) {
				// No direct errback on this module, but something
				// else is listening for errors, so be sure to
				// propagate the error correctly.
				on(depMap, 'error', bind(this, function(err) {
					this.emit('error', err);
				}));
			}
		}

		id = depMap.id;
		mod = registry[id];

		//Skip special modules like 'require', 'exports', 'module'
		//Also, don't call enable if it is already enabled,
		//important in circular dependency cases.
		if (!hasProp(handlers, id) && mod && !mod.enabled) {
			context.enable(depMap, this);
		}
	}));

	//Enable each plugin that is used in
	//a dependency
	eachProp(this.pluginMaps, bind(this, function (pluginMap) {
		var mod = getOwn(registry, pluginMap.id);
		if (mod && !mod.enabled) {
			context.enable(pluginMap, this);
		}
	}));

	this.enabling = false;

	this.check();
}
```

`this. depMaps`就记录着当前模块的依赖，`bind()`函数只是在其中又套了一层函数，不知是为什么，`each()`将会遍历它的第一个输入参数，将它们每一个都做为第二个参数（函数）的参数，然后运行第二个参数（函数）。总之就是用那个回调函数对第一个参数里面的每一个数据都运行一次。
接下来的挺好懂，`depMap`就是当前依赖的模块名字，根据规则`new Module()`，然后配置之，接下来是`on()`，这个方法代码不长，但是里面套了几层，最后到了这里：
```javascript
on: function (name, cb) {
    var cbs = this.events[name];
    if (!cbs) {
		cbs = this.events[name] = [];
    }
    cbs.push(cb);
}
```

简而言之它把后面`bind`里面那个回调函数外带现在的输入参数给存了起来，注意，此时并没有运行。
随后便是`context.enable()`，这个方法的源码：
```javascript
enable: function (depMap) {
    var mod = getOwn(registry, depMap.id);
    if (mod) {
		getModule(depMap).enable();
    }
}
```

很明显就是加载这个新的依赖。这个新的依赖加载完成之后，依旧触发`completeload()`，然后就取出模块去`init()`，中间的过程省略了，反正最后跳转到了`check()`那里，在这里将会运行它的回调，然后不同的地方在这里，`check()`最后是这样的：
```javascript
if (this.defined && !this.defineEmitted) {
    this.defineEmitted = true;
    this.emit('defined', this.exports);    
	this.defineEmitComplete = true;
}
```

`defined`表示当前依赖的回调已经运行完了，以后都不关它的事儿了，随后将会进`this.emit()`，它的代码是这样的：
```javascript
emit: function (name, evt) {
    each(this.events[name], function (cb) {
		cb(evt);    
	});
    if (name === 'error') {
		//Now that the error handler was triggered, remove
        //the listeners, since this broken Module instance
        //can stay around for a while in the registry.        
		delete this.events[name];
    }
}
```

是不是很眼熟啊，和上面那个`this.on`的代码很像吧，不过刚好反了过来，`this.on`将参数和回调都存了起来，这里就会挨着全部取出来并且依次运行，就这样一层一层的运行。

所以，看明白了吗。简而言之就是加入碰到了需要加载的依赖，会将当前数据全部保存起来，然后去加载新的依赖，直到最后碰到一个不需要加载依赖的模块，此时这个模块将会被首先标记为`initd =  true`，然后执行它的回调，执行完成之后将会从全局变量中依次取出之前的数据，挨个运行回调。
这个方式很眼熟吧，其实就是递归。`requirejs`调用模块的本质就是递归调用，不过却不是程序自动调用递归，而是完全手动管理的递归调用。之所以要用手工管理，我想大概是因为依赖模块的加载全部都是异步的，不可能用同步的方法阻塞程序运行。也正是因为这种异步+递归的编程思路，让我觉得这个代码实在是比较难以理解……

# 总结
1. 从编程风格上来说`requirejs`模块的代码虽然少，但是构思非常巧妙，采用了手工管理的递归+异步的编程方式，导致代码理解起来比较困难，再加上其中为了保护内部数据，采用了大量的闭包，无处不在的回调，让我比较头晕。
2. 从结构上来说，源码中最大的部分就是`newContext()`，这里面定义了一个通用`Module`类，大量的工具函数，并维护了一个存有诸多临时变量的闭包。
3. 初始化的过程其实就是把`data-main`当作一个特殊的依赖来处理的。
4. `define`和`require`虽然都是在最后执行回调，但是两者执行的时间其实不一样，`define`是在最后触发`completeload()`事件的最后执行回调，而`require`是在最开始定义的延迟4ms的延迟函数里面执行回调，从事件上来说，`completeload()`事件肯定要早于`require`的异步事件。
5. 我也只是很浅显的读了读代码，不敢保证完全正确，如果有错误还望指正……另外还有些地方不甚明了，比如`require.config`的那个问题……以后有机会再看吧。以上！