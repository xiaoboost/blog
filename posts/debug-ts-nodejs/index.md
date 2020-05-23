---
title: VSCode 中调试 TypeScript
date: 2020/05/23
description: 总结了下现在在 VSCode 中调试 TypeScript 的三种方法。很常用，但是又略有些麻烦，经常忘掉，所以记录下来。
---

如未特殊说明，以下调试的代码均为`Nodejs`环境。{.note}

# 编译调试

VSCode 的调试任务都需要在项目根目录中配置`.vscode/launch.json`文件作为调试任务的启动配置。这里实际上是直接调用 node 启动调试，`Nodejs`环境并不原生支持 ts 语言，所以在调试之前必须要先将 ts 代码编译成 js 代码。编译 ts 代码的方式就很多了，直接使用`tsc`或者是使用什么工具都可以。这种方式有个小缺点，就是编译和运行是分开的两个命令，没办法做到编译完成自动开始调试，需要自己手动点，就有点麻烦。这里就介绍以下 VSCode 的 preLaunchTask 功能，顾名思义它就是先运行某个命令再运行调试，这就可以达到编译完成后自动开始调试了。

参考`.vscode/launch.json`配置：

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "debug",
            "type": "node",
            "request": "launch",
            "sourceMaps": true,
            "stopOnEntry": true,
            "preLaunchTask": "compile",
            "program": "${workspaceRoot}/out/index.js",
            "env": {
                "NODE_ENV": "development"
            }
        }
    ]
}
```

具体的可以参考文档：[launch.json](https://code.visualstudio.com/docs/editor/debugging#_launchjson-attributes)
