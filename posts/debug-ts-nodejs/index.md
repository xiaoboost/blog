---
title: VSCode 中调试 TypeScript
date: 2020/05/23
description: 总结了下现在在 VSCode 中调试 TypeScript 的三种方法。很常用，但是又略有些麻烦，经常忘掉，所以记录下来。
---

如未特殊说明，以下调试的代码均为`Nodejs`环境。{.note}

# 编译调试

VSCode 的调试任务都需要在项目根目录中配置`.vscode/launch.json`文件作为调试任务的启动配置。由于`Nodejs`环境并不原生支持 ts 语言，所以在调试之前必须要先将 ts 代码编译成 js 代码。编译 ts 代码的方式就很多了，使用`tsc`或者是`rollup`之类的工具都可以，但是这种方式有个小缺点，就是编译和运行是分开的两个命令，没办法做到编译完成自动开始调试，需要自己手动点，就有点麻烦。这里要介绍的就是配置中的`preLaunchTask`选项，顾名思义它就是先运行某个命令再运行调试，这就可以达到编译完成后自动开始调试了。

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
            "preLaunchTask": "compile", /*** hl ***/
            "program": "${workspaceRoot}/out/index.js",
            "env": {
                "NODE_ENV": "development"
            }
        }
    ]
}
```

上面的代码中，将`preLaunchTask`指向了`compile`任务，这个任务就是我们的预编译任务。而 VSCode 的任务配置是放在`.vscode/tasks.json`文件中。这里以本地运行`tsc`命令为例，配置如下：

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "compile", /*** hl ***/
            "command": "node",
            "args": [
                "${workspaceRoot}/node_modules/typescript/lib/tsc.js",
                "-p", ".",
                "-m", "CommonJS",
                "--sourceMap", "true",
                "--outDir", "./out/"
            ]
        }
    ]
}
```

这里的预编译任务是启动本地`node_modules`中的`tsc`脚本，这和全局 tsc 命令是一样的。这个预编译任务运行完成之后，就会立即启动我们真正的调试任务。

不过这种方式还是有缺陷，就是每次都要预编译，如果代码规模较大速度就会很慢，并且我们实际上调试的还是最后的 js 代码，原本在 ts 代码中的路径设置几乎都会失效，这就导致我们写代码就必须要全部使用相对路径