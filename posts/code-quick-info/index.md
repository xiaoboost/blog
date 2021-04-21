---
title: 静态代码提示
create: 2021/03/22
description: TypeScript 官网不知道啥时候上线了静态代码提示功能，看着觉得非常不错，于是准备在博客里也做一个。
---

所谓“静态代码提示”，就是指在没有语言服务的情况下，只是纯文本的也能展示出代码类型提示的功能。如下所示：

```ts platform=browser
// 将鼠标放在变量上

interface Point {
  x: number;
  y: number;
}

function print(pt: Point) {
  console.log("The coordinate's x value is " + pt.x);
  console.log("The coordinate's y value is " + pt.y);
}

print({
  x: 100,
  y: 100,
});
```
