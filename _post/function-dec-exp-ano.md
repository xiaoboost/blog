title: 函数声明与函数表达式
category: 软件设计
date: 2016-02-18
tag: [JavaScript,规范]
layout: post
toc: true

---

函数声明和函数表达式是JavaScript初学者比较容易混淆的概念，它们似乎很相似，又似乎在哪里有点不一样，本文就主要讲述这俩的联系与区别，以及它们运用过程中的一些细节。
<!--more-->

<p class="warning">
本文中的所有规范均是ES6版本的。
</p>

这俩哥们是JavaScript初学者非常容易弄混淆的概念，主要是这俩太过似是而非了。它们虽然都可以用来定义函数，但是它们之间也都有些微妙的区别。

它们在代码中通常都是这样的：
```javascript
//函数声明
function fn1(a) {   
  console.log(a);
}

//函数表达式
var fn2 = function(a) {       
  console.log(a);
}
```
* 函数声明直接使用了`function`声明并指定函数名称。
* 函数表达式是先定义了一个函数然后将这个函数赋值给了一个变量。

这就是一般意义上的函数声明和函数表达式了，但是实际上这并不准确。那么这两者的准确定义是什么？这就要先从它们的语法形式开始说起了。

# 语法
规范之中对它们的语法是这样定义的——
> 13 Function Definition # Ⓣ Ⓡ
> Syntax
> *FunctionDeclaration* :
> 　　function *Identifier* ( *FormalParameterList*_opt_ ) { *FunctionBody* }
> *FunctionExpression* :
> 　　function *Identifier*_opt_ ( *FormalParameterList*_opt_ ) { *FunctionBody* }

可以很明显的看出，从语法上来说，函数声明与函数表达式只有一个标识符（`Identifier`）的差别，函数声明必须拥有标识符，而函数表达式的标识符是可选的（`opt`）,就是说函数表达式可以是匿名函数。

再来看看句法结构：
> Program :
> 　　SourceElements_opt_
> SourceElements :
> ​　　SourceElement
> 　　SourceElements SourceElement
> SourceElement :
> 　　Statement
> 　　FunctionDeclaration
> Statement : 
> 　　……
> 　　ExpressionStatement :
> 　　　　[lookahead ∉ {{, function, class, let [} Expression ;
> 　　……

我省略了部分结构，js的语法解析树从`Program`为根节点依次向下，可以看到`FunctionDeclaration`和`Statement`是同一个级别的，同样会归约到`SourceElement`节点。而只要语句不是以`{`、`function`、`class`、`let`、`[`开头的，那么当前语句就会被解析成为`ExpressionStatement`。
所以js解析器在进行词法分析的时候，当它碰到了`function(){}`这个语句，很明显这个语句是`function`开头的，那么它会优先解析成`FunctionDeclaration`，随后对它做格式检查，这个语句之中并没有指定函数的标识符名称，所以这里肯定就会抛出一个语法错误。
```javascript
Uncaught SyntaxError: Unexpected token (
```
语法错误，意外的标记`(`。
所以以`function`开头的语句，必然会被解析成为函数声明，而函数声明就必须要有标识符名字。

所以，只要语句的开头不是`function`，那么它就不会被解释器认为是函数声明了。具体来说，就是以别的符号（标记）来作为语句的开头，提示解释器这里并不是函数声明，不能按照函数声明来解析。
比如在语句开头使用一元运算符，又比如将它放在`if`的条件之中，只要按照规则将它放在应该是表达式的地方，解释器就会把它按照是表达式的方式进行解析。确定了是表达式，再碰到`function`开头的语句，那肯定就会解析成函数表达式了。
比如，下列这些语句就都是合法的。
```javascript
!function () { /* code */ };
~function () { /* code */ };
-function () { /* code */ };
+function () { /* code */ };

if(function () { /* code */ }) {};
```
当然，函数表达式最常见的用法还是`var test = function(){}`，函数表达式赋值。

# 声明提升
JavaScript的声明具有提升效果，但是函数声明和变量声明的优先级是不一样的，那么函数表达式赋值语句和函数声明的优先级是怎么算的呢？
请看下面的两段代码——
```javascript
A:
function fn1() {
  console.log("1");
}
var fn2 = fn1;
function fn1() {
  console.log("2");
}
fn2();     	//2;

B:
function fn1(){
  console.log("1");
}
var fn2 = fn1;
fn1 = function(){
  console.log("2");
}
fn2();		//1;
```
这两段代码的区别就在于`fn1`第二次定义的时候上面采用的是函数声明，而下面是函数表达式。
这个现象的原因很容易就能想到。在上面已经提到过了，函数声明`FunctionDeclaration`的优先级比较高，这就导致函数声明将会被提升至当前作用域的最上端。而对于函数表达式，函数本身被当作了一个值，那么它所在的赋值语句实际上被认为是`变量声明`了。所以上面的两段代码其实应该等效为——
```javascript
A:
function fn1() {
  console.log("1");
}
function fn1() {
  console.log("2");
}
var fn2;
fn2 = fn1;
fn2();

B:
function fn1() {
  alert("1");
}
var fn2;
fn2 = fn1;
fn1 = function () {
  alert("2");
}
fn2();
```
所以，函数声明的优先级最高，而函数表达式会被当作一个值来操作，它的声明是否提升取决于它被赋值的变量。

## 函数表达式赋值的死区
对于函数声明，由于提升的关系，它的作用域属于整个封闭作用域内部，所以这个函数可以在作用域内部任何地方使用。比如：
```javascript
test();	//test

function test() {
	console.log("test");
}

test();	//test
```
对于函数表达式赋值语句而言，它是否提升是依赖于被赋值的变量的，并且即便是提升，也是那个被赋值的标识符提升，函数本身是没有跟着提升的。这样就会造成一个死区，即标识符存在，但是函数却不存在的区域。看代码：
```javascript
typeof test;	//"undefined"
test();			//Uncaught TypeError

var test = function(){
	console.log("test");
}
```
发生了类型错误。`TypeError`就意味着，当前这个标识符在作用域中被找到了，但是当前运算所需要的类型和它本身的类型不匹配。从第一句`typeof`可以看出，标识符已经存在，但是值是`undefined`。
所以说，从当前作用域开始，直到赋值语句所在的语句，这之间的区域内，变量存在，但是函数却不存在。这也就是所谓“死区”。
这也是很多人喜欢使用函数表达式赋值语句代替声明的原因，这将会强制在定义了函数之后再使用它们，因为在定义之前提前使用函数，这有可能会造成代码逻辑上的混乱。

# 函数表达式的匿名与具名
很多人可能都没有注意到这一点，毕竟大多数使用函数表达式赋值的人，通常使用的都是匿名函数。
但是，假如你在使用函数表达式赋值的时候，这个函数是具名的，那么这个函数标识符的作用域是属于哪里的？
来看下面的代码：
```javascript
var test = function ss(){
	console.log("test");
}
ss();
```
来猜猜它的结果如何？

我就不卖关子了，这里会抛出`ReferenceError`，也就是引用错误。所谓引用错误，就是说这个你引用的标识符在当前作用域内就不存在。
为什么会这样？给函数表达式中的函数加上标识符，这种形式叫做`具名函数表达式`，它的运行方式和匿名函数表达式以及普通函数表达式有很大的不同。

不管是函数声明，还是匿名具名的函数表达式，它们的声明实例化都是通过调用`FunctionDeclarationInstantiation`这个抽象方法来实现的，这个方法很长，我就不贴了，有兴趣的可以看看这个链接（[函数声明实例化](https://tc39.github.io/ecma262/#sec-functiondeclarationinstantiation)）。
`函数声明`在其中会调用`CreateMutableBinding`方法，这个方法会在当前环境中创建一个新的，但是还未初始化的可绑定的环境记录。这也就意味着，这个函数标识符就会存在于作用域内部了。
`匿名函数表达式`在其中同样调用`CreateMutableBinding`方法，但是标识符却是函数体的内部`text`代码。其余和函数声明一样。
而对于`具名函数表达式`，它则会调用`NewDeclarativeEnvironment`。该方法将创建一个新的空词法环境，这个新的词法环境将会嵌套在当前的环境中，然后以新的词法环境为作用域，将这个函数的标识符绑定在这个新的词法作用域内部，最后将函数的引用交给左侧的变量。因此这里的函数标识符是绑定在新的词法环境中的，外部环境也就无法找到它。

至于这么设计的原因，我觉得可能是为了解决两个问题：
1. 防止函数表达式的标识符污染外部作用域。
2. 让函数表达式内部可以使用递归等需要引用自身代码。

# 立即执行函数
常见的立即执行函数有两种写法`( function(){…} )()`和`( function (){…} () )`，很多人对这两种形式到底有什么区别比较感兴趣，我在这里简单说说。
通过第一章的分析，很明显这里的小括号只是起着提示这里是表达式的作用。

括号，在JavaScript中被称作括号运算符（`Grouping Operator`），它一共有3个静态语义：`Early Errors`、`IsFunctionDefinition`以及`IsValidSimpleAssignmentTarget`；另外还有1个动态语义：`Evaluation`。
静态语义是在代码运行之前的时候辅助预编译的，这里可以先不管它，我们只需要关注动态语义。
`Evaluation`这个语义，直译是`评估`，怎么说呢……我实在不好描述它到底是干嘛的……它在规范中无处不在，无论是调用函数还是表达式求值，首先运行的就是它，它取出式子，经过了某种转换，然后再运行/求值，我觉得可以当作是某种转换操作吧，但是它对于语义本身是没有任何影响的。

为了验证这点，我们可以找个AST语法树构建工具来为这两者构建语法树，看看结果怎样。这里我选用了`uglify-js`，由它内置的分析器来构建语法树。结果如下：
```javascript
//语句
( function(){} )();
//语法树
ast = {
  type:"Program",
  body:[
	type: "ExpressionStatement",
	expression: {
	  type: "CallExpression",
	  arguments: []
	}
  ]
}

//语句
( function(){}() );
//语法树
ast = {
  type:"Program",
  body:[
	type: "ExpressionStatement",
	expression: {
	  type: "CallExpression",
	  arguments: []
	}
  ]
}
```
可以看到，两者最后生成的语法树一模一样，最后都是函数调用。因此，就解释器而言，这俩是完全一样的，没有任何区别。

# 总结
1. 从语法上来说，语句`function`开头的时候，解释器就会把这句话当作是函数声明；想要解释器按照函数表达式进行解析，就需要和运算符以及和需要表达式的其他关键字配合。
2. 函数和变量有声明提升，函数声明会属于全部封闭作用域，但是函数表达式会有死区区间存在，即变量标识符存在，但函数却不存在的区域。
3. 具名函数表达式的函数标识符的作用域是属于它自己的，在外部作用域中不存在。
4. 立即执行函数的两种写法从语法上来说有微妙的区别，但是最后生成的语法树一模一样，没有区别。