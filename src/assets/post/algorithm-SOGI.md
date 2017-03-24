title: SOGI算法简析
category: 软件设计
date: 2015-01-05
tag: [C,PLL,算法,滤波器]
layout: post
toc: true

---

锁相环（PLL）技术，顾名思义就是相位同步的技术。在电力电子领域主要使用在逆变器、APF以及SVG等设备中。有很多种算法都能实现这个技术，本文主要介绍了个人认为其中比较有亮点的SOGI算法。
<!--more-->

# 前言
SOGI是一个很有意思的算法，这个算法不仅可以用于锁相，还可以用于提取基波，幅值估计，随着谐振频率的不同还可以直接用来提取特定频率的正弦波，用途很广泛。另外还能解决单相交流检测中需要构造一路延迟90°交流分量造成的延迟问题。对于锁相环技术，现在主流仍然是同步坐标旋转法。但是这些方法都面临着非理想电网电压情况下难以准确快速响应的问题，电网中的谐波成分造成了滤波器设计上困难，最后只能是在准确性和快速性中取折衷。
SOGI顾名思义是一个二阶的广义积分器，通过SOGI和传统的`SRF-PLL`结合起来，结构上只使用了一个SOGI以及一次DQ变换，就可以在保证动态响应快速性的同时，有效的提高锁相环对电网电压的适应性。

PS：因为手上没有设备啦，所以这次就只能以单相交流为主，不涉及三相电。不过SOGI在三相电和单相电的应用其实都差不多，举一反三还是很容易的。

# 二阶广义积分器
传统的方法中，为了获得两相正交的电压信号，都需要对输入电压信号进行`90°`相位偏移，一般而言这种正弦的偏移可以通过周期延迟、微分、全通滤波器等方案，但是这些方法的动态响应并不理想，尤其是微分这样对谐波敏感的方法，更是会干扰基波的提取。

## 原理
为了实现控制器的无静差控制，传递函数中就必须包含受控系统的`s`域模型，以使得控制系统在某一频率处的控制增益在理论上无穷大，从而实现无静差控制。由于网侧电压一般都是正弦波形，所以我们就必然要在控制器中包含正弦的s域模型。从这一点上来说，一般意义上的`PI控制器`很难做到对正弦的无差控制。

对正弦做拉普拉斯变换，可以得到：
$$
\mathcal{L}[sin(\omega_0 t)](s) = \frac{\omega_0 }{s^2+\omega_0 ^2}
$$
那么，要是当控制器的传递函数比正弦的传递函数还要再高上一阶的话，理论上就能实现对正弦的无静差控制了。那么可以设这样的控制器传递函数为：
$$
G(s)=K_P+\frac{K_R\cdot s}{s^2+\omega_0 ^2}
$$
上式也正是比例谐振（PR）控制器的传递函数。式中*K_P_*为比例系数，*K_R_*为谐振系数，*ω_0_*为谐振频率。PR控制器中的积分环节又称为*广义积分器（Generalized Integrator, GI）*。

单独将GI环节拿出，可以根据传递函数绘制系统框图，如下：
![GI环节系统框图](/img/algorithm-SOGI/GI-moudle.gif)
根据系统框图，可以得到：
$$
\left\{\begin{matrix}
G_1(s)=\frac{\upsilon '}{\upsilon }=\frac{s}{s^2+\omega_0 ^2}\\
G_2(s)=\frac{q\upsilon '}{\upsilon }=\frac{\omega_0 ^2}{s^2+\omega_0 ^2}
\end{matrix}\right.
$$
可以很明显的看出，*G_1_(s)*和*G_2_(s)*在时域分别对应的是函数*cos(ω_0_t)*以及*sin(ω_0_t)*，而这两个函数刚好相差*90°*，满足构建锁相环的基本条件。
将GI环节闭环，这就构成了一个以二阶广义积分器为核心的自适应滤波器，并且输出的两路信号相互正交。如下图：
![二阶广义积分器的正交发生器](/img/algorithm-SOGI/Adaption-GI-moudle.gif)
为了分析系统特性，计算传递函数，化解可得：
$$
\left\{\begin{matrix}
G_{D1}(s)=\frac{\upsilon '}{\upsilon }=\frac{k\cdot s}{s^2+k\cdot s+\omega_0 ^2}\\
G_{Q1}(s)=\frac{q\upsilon '}{\upsilon }=\frac{k\cdot \omega_0}{s^2+k\cdot s+\omega_0 ^2}
\end{matrix}\right.
$$
从传递函数中可以看出，`G_D1_`是一个带通滤波器，根据带通滤波器的典型传递函数，可以求出此带通滤波器的品质因数：$$Q_{D1}=\frac{\omega_0}{k}$$
很明显的，系统的品质因数会随着输入信号频率的波动而发生变化，对系统造成影响，为了克服这一不足，可以对SOGI进行适当的改进，如下图：
![改进的二阶广义积分器](/img/algorithm-SOGI/mend-SOGI.gif)
改进之后的SOGI传递函数为：
$$
\left\{\begin{matrix}
G_{D2}(s)=\frac{\upsilon '}{\upsilon }=\frac{k\cdot \omega_0 \cdot s}{s^2+k\cdot \omega_0 \cdot s+\omega_0 ^2}\\
G_{Q2}(s)=\frac{q\upsilon '}{\upsilon }=\frac{k\cdot \omega_0^2}{s^2+k\cdot \omega_0 \cdot s+\omega_0 ^2}
\end{matrix}\right.
$$
对于`G_D2_`，对比带通滤波器的典型传递函数，求得它的品质因数为：$$Q_{D1}=\frac{1}{k}$$
显然，改进之后的滤波器性质只与系统增益`k`有关，而与*ω_0_*无关。设*ω_0_ = 314rad/s*（即`50Hz`），那么G_D2_和G_Q2_的频率响应分别是：
![G_D2_(s)频率响应](/img/algorithm-SOGI/GDs.gif)
G_D2_对外显示带通滤波器的性质，且随着`k`的增大，带宽也越来越宽。

![G_Q2_(s)频率响应](/img/algorithm-SOGI/GQs.gif)
G_Q2_对外显示低通滤波器的性质，且随着`k`的增大，增益下降也越慢。

## SOGI的锁相环
SOGI良好的带宽特性，使得其在电压畸变，相位突变等非理想情况下仍能具有比较好的动态和稳态性能。用SOGI代替传统单相同步旋转坐标系中产生正交信号的环节，这就构成了以SOGI为核心的单相锁相环。如下图：
![基于SOGI的单相锁相环](/img/algorithm-SOGI/SOGI-PLL.gif)
由DQ变换之后，PI控制器对Q轴分量进行跟踪，当相位和频率完全锁定时，一定有$$v_q=0$$。PI之后，加入固有的谐振频率，再将此送回SOGI模块中，作为SOGI的谐振频率，这样就实现了锁相环的频率自适应。

## Matlab仿真
同样的，先用Matlab仿真连续系统模型，Matlab版本号是8.1。仿真模型如下图：
![SOGI-PLL仿真模型 一](/img/algorithm-SOGI/Matlab-simulink1.gif)
为了便于观察输出波形，输出相位用它的正弦函数表示，这样一旦完成锁相，此输出必然与输入重合。由于这里取得是输出的正弦信号，这个正弦是单位幅值，和输入的幅值并不相等，所以对输入信号做一个缩放处理，使得示波器中观察到输入信号幅值为单位幅值。
![锁相环输入包含谐波](/img/algorithm-SOGI/PLL-harmonic-Matlab.gif)
![锁相环输入相位突变](/img/algorithm-SOGI/PLL-phase-Matlab.gif)
上面两图是当锁相环驶入包含谐波以及相位突变时的仿真波形。其中紫色为`输入`，黄色为`输出`。
波形中可以看出，在仿真中在输入包含低频谐波以及相位突变时系统都能准确且快速的捕捉到同步信号。

## SOGI提取基波信号
从SOGI环节具有的优秀的带通以及低通特性来看，似乎仅仅是利用SOGI环节就已经能够实现滤波并且提取出基波信号的功能了，但是实际上并非如此。对SOGI的传递函数进行分析，可以得到*G_D2_*，*G_Q2_*的幅频和相频公式：
$$
v'=\left\{\begin{matrix}
\left | D_2 \right |=\frac{k\cdot \omega_0 \cdot \omega}{\sqrt{(k\cdot \omega_0 \cdot \omega)^2+(\omega^2-\omega_0^2)^2 }}\\
\angle D_2=arctan(\frac{k\cdot \omega_0 \cdot \omega}{\omega_0^2-\omega^2} )
\end{matrix}\right.
$$
$$
qv'=\left\{\begin{matrix}
\left | Q_2 \right |=\frac{k\cdot \omega_0^2}{\sqrt{(k\cdot \omega_0 \cdot \omega)^2+(\omega^2-\omega_0^2)^2 }}\\
\angle Q_2=arctan(\frac{\omega^2-\omega_0^2}{k\cdot \omega_0 \cdot \omega} )
\end{matrix}\right.
$$
对于相角做差，一定有：
$$
\angle D_2-\angle Q_2=arctan(\frac{k\cdot \omega_0 \cdot \omega}{\omega_0^2-\omega^2} )-arctan(\frac{\omega^2-\omega_0^2}{k\cdot \omega_0 \cdot \omega} )=\frac{\pi }{2}
$$
可以看出，两路输出是恒定正交的，与输入信号无关。但是很明显的对于幅频函数而言，是和谐振角频率与输入信号角频率相关的，要是两者相等，即 $$\omega_0=\omega$$，则一定有：
$$
\left\{\begin{matrix}
\left | D_2 \right |=1\\
\left | Q_2 \right |=1
\end{matrix}\right.
$$
说明此时SOGI的输出对基波幅值没有影响，可以正常提取基波。一旦$$\omega_0\neq\omega$$，SOGI输出的幅值就不会等于输入信号的基波幅值。所以要能够正常提取输入信号的幅值，就必须要让SOGI具有对输入信号角频率的自适应功能。而上面介绍的PLL模型恰好也是可以实现这个功能的。所以提取基波的模型实际和PLL的环节是一样的，只是取出的信号不同而已。

## Matlab仿真
仿真模型如图所示：
![SOGI-PLL仿真模型 二](/img/algorithm-SOGI/Matlab-simulink2.gif)

仿真波形如下：
![输入信号包含谐波时的稳态](/img/algorithm-SOGI/fundamental-harmonic-Matlab.gif)
![输入信号幅值突变](/img/algorithm-SOGI/fundamental-amplitude-Matlab.gif)
![输入信号频率突变](/img/algorithm-SOGI/fundamental-frequency-Matlab.gif)
可以看出，输入信号含有谐波时，SOGI优秀的滤波器性能可以很好的提取出基波；幅值与频率突变时，自适应功能也很快起了作用，使得输出能够正确的提取出输入的基波。

# 基于28335的实验
在这里直接使用后向差分编写代码：
```c
float PLL_Voltage(float u_i)
{
    float P_u  = 200 , I_u = 30;                    //锁相环控制PI参数
    float k    = 1;                                 //滤波系数
    float ts   = 0.00002;                           //计算周期
    float w_ff = 314.159265359;                     //50Hz角频率
    float PI_uout , u_q;
	
    u_alpha += ((u_i-u_alpha)*k-u_beta)*u_w*ts;     //alpha与输入信号同相
    u_beta  += u_alpha*u_w*ts;                      //beta与输入信号相差90度
	
    u_q = u_cos*u_alpha + u_sin*u_beta;             //取dq变换中的q
	
    uq_integra += u_q*ts;                           //计算PI控制器中的积分项
    PI_uout     = P_u*u_q + I_u*uq_integra;         //PI调节器
	
    u_w     = w_ff + PI_uout;                       //加入固定的谐振频率（50Hz）
    u_seta += u_w*ts;                               //角速度积分得到角度
    if (u_seta-6.283185>0) u_seta=0;                //角度超过2pi之后重置
	
    u_sin=sin(u_seta);                              //更新同步信号相位的sin和cos
    u_cos=cos(u_seta);
	
    return u_sin;                                   //返回同步信号的正弦值
}
```

## 硬件平台
这次是在28335上面实验的，本来想用STM32，因为STM32上面自带DA模块，输出波形会比较好弄，可惜我自己的那个STM32板子坏掉了，只能用手上的这个28335。然而28335是没有DA模块的，好在这次模拟输出的波形频率都比较低，所以我在这里使用`PWM`输出来模拟——输出PWM波，根据输出电压的不同改变占空比，之后加入低通滤波器提取出低频信号。
这次`PWM`的频率是`150kHz`，低通滤波器的电路图以及Bode图如下：
![低通滤波器电路图](/img/algorithm-SOGI/Low-pass.gif)
![低通滤波器Bode图](/img/algorithm-SOGI/Filter-Frequency-Response.gif)
其中红色是`幅频曲线`，绿色是`相角曲线`，紫色是`群延迟曲线`。
从Bode图中，可以看出至少在`1kHz`以及其以下频率信号都是可信的。

输出波形用示波器观察，输入信号由信号发生器模拟。
示波器型号是`DSO3012`，信号发生器型号是`AFG3102`，DSP型号为`TMS320F28335`。

为了说明硬件平台的可行性，以及SOGI输出最基本的正弦特性，捕捉了输入为`50Hz`交流的输出波形，并对其进行`FFT`分析。
![低通滤波器电路图](/img/algorithm-SOGI/source50Hz.gif)
图中可以看出输出信号只含有`50Hz`基波信号，几乎不含有其他低频信号，至少说明SOGI的输出的正弦是十分标准的，并未发生畸变。

## 作为锁相环
此时输出信号提取的是系统最后输出`θ`的正弦值。

### SOGI-PLL启动
![低通滤波器电路图](/img/algorithm-SOGI/start.gif)

### 不同频率下的稳态
`蓝色`为输入信号，`浅蓝色`为输出信号。
示波器图片中保留了`输入频率`以及`输入输出信号相位差`两栏数据作为参考。
![输入信号频率30Hz](/img/algorithm-SOGI/fundamental-frequency-30Hz.gif)
![输入信号频率40Hz](/img/algorithm-SOGI/fundamental-frequency-40Hz.gif)
![输入信号频率50Hz](/img/algorithm-SOGI/fundamental-frequency-50Hz.gif)
![输入信号频率60Hz](/img/algorithm-SOGI/fundamental-frequency-60Hz.gif)
![输入信号频率70Hz](/img/algorithm-SOGI/fundamental-frequency-70Hz.gif)

### 相位突变
![输入相位突变90°](/img/algorithm-SOGI/Phase-90.gif)
![输入相位突变180°](/img/algorithm-SOGI/Phase-180.gif)

## 提取基波信号
此时输出信号提取的是系统中相角相差`90°`的正交信号$$v'$$与$$qv'$$。
本来想在接下来的全部实验都用两路正交信号来显示，但是奈何示波器的档次不够高，只有两路输入，所以我在这里只展示了下两路正交信号是正常工作的，之后的提取基波实验只会显示和基波同步的那一路输出，还望见谅。

### 正交信号
![相差90°的正交信号](/img/algorithm-SOGI/u_q-and-u_qv.gif)

### 输入含有低次谐波
![输入含有100Hz谐波](/img/algorithm-SOGI/The-harmonic-100Hz.gif)
![输入含有200Hz谐波](/img/algorithm-SOGI/The-harmonic-200Hz.gif)
![输入含有300Hz谐波](/img/algorithm-SOGI/The-harmonic-300Hz.gif)
![输入含有400Hz谐波](/img/algorithm-SOGI/The-harmonic-400Hz.gif)
![输入含有500Hz谐波](/img/algorithm-SOGI/The-harmonic-500Hz.gif)

### 幅值突变
![幅值由大变小](/img/algorithm-SOGI/Amplitude-large-to-small.gif)
![幅值由小变大](/img/algorithm-SOGI/Amplitude-small-to-large.gif)
由于信号发生器的幅值并不是瞬间的，而是有一个过程的，所以在这里看到输入和输出都有一段非正弦的波形。但是一旦输入信号恢复成正弦，输出信号非常迅速的跟踪上了。

# 后记
早些时候我有位学姐调试光伏逆变器，但是PLL似乎有些问题，当时她们使用的是同步坐标旋转，这种方法稳定性好，但就是动态性能欠缺一点。这事儿后来我也没关注了，最近几天翻文献的时候，看到了这么一种方法，觉得甚是巧妙，于是就做了这么一个小实验。
总的来说SOGI算法和其数学模型并不复杂，不过虽然性能出众，但是我就只是看到很多论文，实际中似乎很少用，不知道为啥。

# 参考文献
张兴，张崇巍 《PWM整流器及其控制》
[A New Single-Phase PLL Structure Based on Second Order Generalized Integrator](http://pan.baidu.com/s/1kTwZ5XH)
[Design and Operation of a Phase-Locked Loop with Kalman Estimator-Based Filter for Single-Phase Applications](http://pan.baidu.com/s/1gdmspGZ)