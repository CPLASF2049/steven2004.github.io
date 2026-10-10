---
title: 量子机器学习前置数学基础笔记
date: 2026-10-10 21:38:21
categories:
  - 学习笔记
tags:
  - 量子计算
  - 量子机器学习
  - 线性代数
  - 数学基础
description: 为量子自编码器（QAE）学习整理的数学基础笔记：克罗内克积、狄拉克符号与内外积、迹与密度矩阵、迹距离与保真度、布洛赫球面、量子门基础，每节附自测习题。
index_img: /img/cover-quantum.jpg
banner_img: /img/cover-quantum.jpg
---
> 用途：量子自编码器(QAE)学习，包含克罗内克积、狄拉克符号、内积外积

## 1 矩阵的张量积（克罗内克积 Kronecker product）
矩阵张量积一般就是指克罗内克积，记号 $A\otimes B$。
⚠️ 不是普通矩阵乘法，也不是外积。

### 1.1 定义
设 $A\in\mathbb{C}^{m\times n}$，$B\in\mathbb{C}^{p\times q}$，则 $A\otimes B$ 是 $mp\times nq$ 的矩阵：
$$
A\otimes B=
\begin{pmatrix}
a_{11}B & a_{12}B & \dots & a_{1n}B\\
a_{21}B & a_{22}B & \dots & a_{2n}B\\
\vdots & \vdots & \ddots & \vdots\\
a_{m1}B & a_{m2}B & \dots & a_{mn}B
\end{pmatrix}
$$

理解方式：取出矩阵$A$中每一个元素$a_{ij}$，用这个数乘以完整矩阵$B$，作为分块填入。

### 1.2 示例
$$
A=\begin{pmatrix}1 & 2\\3 & 4\end{pmatrix},\quad B=\begin{pmatrix}0 & 5\\6 & 7\end{pmatrix}
$$
$$
A\otimes B=\begin{pmatrix}1\cdot B & 2\cdot B\\3\cdot B & 4\cdot B\end{pmatrix}=
\begin{pmatrix}
0 & 5 & 0 & 10\\
6 & 7 & 12 & 14\\
0 & 15 & 0 & 20\\
18 & 21 & 24 & 28
\end{pmatrix}
$$

### 1.3 核心性质
1. 不交换：$A\otimes B \neq B\otimes A$
2. 分配律
$$
\begin{align*}
A\otimes(B+C)&=A\otimes B+A\otimes C\\
(A+B)\otimes C&=A\otimes C+B\otimes C
\end{align*}
$$
3. 数乘：$(\lambda A)\otimes B=A\otimes(\lambda B)=\lambda(A\otimes B)$
4. 混合乘积（最重要，量子算子高频使用）
$$(A\otimes B)(C\otimes D)=(AC)\otimes(BD)$$
> 前提：$AC$、$BD$ 可以执行普通矩阵乘法
5. 转置：$(A\otimes B)^T=A^T\otimes B^T$
6. 逆：$A,B$ 均可逆，则 $(A\otimes B)^{-1}=A^{-1}\otimes B^{-1}$
7. 迹：$\mathrm{tr}(A\otimes B)=\mathrm{tr}(A)\cdot \mathrm{tr}(B)$
8. 行列式：$A\in\mathbb{C}^{m\times m},B\in\mathbb{C}^{p\times p}$
$$\det(A\otimes B)=(\det A)^p\cdot(\det B)^m$$
9. 特征值：$A$特征值$\lambda_i$，$B$特征值$\mu_j$，则$A\otimes B$全部特征值为$\lambda_i\mu_j$

### 1.4 向量的克罗内克积
向量 $\boldsymbol{a}\in\mathbb{C}^m,\boldsymbol{b}\in\mathbb{C}^n$
$$
\boldsymbol{a}\otimes\boldsymbol{b}=
\begin{pmatrix}
a_1\boldsymbol{b}\\a_2\boldsymbol{b}\\\vdots\\a_m\boldsymbol{b}
\end{pmatrix}
\in\mathbb{C}^{mn}
$$

算子作用性质：
$$(A\otimes B)(\boldsymbol{x}\otimes\boldsymbol{y})=(A\boldsymbol{x})\otimes(B\boldsymbol{y})$$
> 多量子比特系统算子运算核心公式

### 1.5 应用场景
- 矩阵方程求解：$\mathrm{vec}(AXB^T)=(B\otimes A)\mathrm{vec}(X)$
- 量子力学：多粒子复合态空间、多量子比特算子
- 图像处理、张量分解、偏微分方程离散
- 机器学习：核方法、克罗内克分解降参

### 1.6 易混淆运算对比
- 克罗内克积 $A\otimes B$：张量积，矩阵分块放大，维度相乘
- 普通矩阵乘法 $AB$：行乘列，要求维度匹配
- 哈达玛积 $A\circ B$：对应元素相乘，两矩阵尺寸必须相同

---

## 2 量子比特：狄拉克符号，内积、外积
量子态使用右矢 $|\psi\rangle$，是复向量空间 $\mathbb{C}^2$ 的列矢量；
左矢 $\langle\psi|$ 是其对偶矢量，行向量。

> 量子内积定义：左矢作用右矢，结果为复数。

### 2.1 内积 $\langle\phi|\psi\rangle$
#### 定义
$$
|\psi\rangle=\begin{pmatrix}\psi_0\\\psi_1\end{pmatrix},\quad
|\phi\rangle=\begin{pmatrix}\phi_0\\\phi_1\end{pmatrix}
$$
左矢为右矢的**厄米共轭**：$\langle\phi|=|\phi\rangle^\dagger=\big(\phi_0^*,\ \phi_1^*\big)$

内积：
$$
\langle\phi|\psi\rangle=\phi_0^*\psi_0+\phi_1^*\psi_1
$$

#### 性质
1. $\langle\phi|\psi\rangle=\langle\psi|\phi\rangle^*$，交换两个态得到复共轭
2. 对右矢线性：$\langle\phi|\big(a|\psi_1\rangle+b|\psi_2\rangle\big)=a\langle\phi|\psi_1\rangle+b\langle\phi|\psi_2\rangle$
3. 对左矢反线性：$\big(a\langle\phi_1|+b\langle\phi_2|\big)|\psi\rangle=a^*\langle\phi_1|\psi\rangle+b^*\langle\phi_2|\psi\rangle$
4. 归一化：$\langle\psi|\psi\rangle=|\psi_0|^2+|\psi_1|^2=1$，概率总和为1
5. 正交：$\langle\phi|\psi\rangle=0$，两个量子态正交

#### 物理含义
$|\langle\phi|\psi\rangle|^2$：对$|\psi\rangle$测量，得到$|\phi\rangle$的概率。

示例：计算基
$$|0\rangle=\begin{pmatrix}1\\0\end{pmatrix},\ |1\rangle=\begin{pmatrix}0\\1\end{pmatrix}$$
$$\langle0|0\rangle=1,\langle0|1\rangle=0,\langle1|1\rangle=1$$

哈达玛态 $|+\rangle=\frac{1}{\sqrt{2}}(|0\rangle+|1\rangle)$
$$
\langle0|+\rangle=\frac{1}{\sqrt{2}},\quad |\langle0|+\rangle|^2=\frac12
$$
代表测量$|+\rangle$得到$|0\rangle$的概率为$\frac12$。

### 2.2 外积 $|\psi\rangle\langle\phi|$
- 内积：左矢 × 右矢 → 复数
- 外积：右矢 × 左矢 → 矩阵（线性算子）

#### 定义
$$
|\psi\rangle\langle\phi|
=\begin{pmatrix}\psi_0\\\psi_1\end{pmatrix}
\big(\phi_0^*,\phi_1^*\big)
=\begin{pmatrix}
\psi_0\phi_0^* & \psi_0\phi_1^*\\
\psi_1\phi_0^* & \psi_1\phi_1^*
\end{pmatrix}
$$
属于$\mathbb{C}^2$上2×2矩阵。

示例
$$
|0\rangle\langle0|=\begin{pmatrix}1\\0\end{pmatrix}(1,0)=
\begin{pmatrix}1 & 0\\0 & 0\end{pmatrix}
$$
$$
|1\rangle\langle1|=\begin{pmatrix}0 & 0\\0 & 1\end{pmatrix}
$$
$$
|0\rangle\langle1|=\begin{pmatrix}0 & 1\\0 & 0\end{pmatrix}
$$

#### 物理含义：投影算子
当 $\phi=\psi$，$P_\psi=|\psi\rangle\langle\psi|$ 是投影算子。
$$P_\psi|\alpha\rangle=|\psi\rangle\langle\psi|\alpha\rangle$$
作用：将$|\alpha\rangle$投影到$|\psi\rangle$方向，系数为内积$\langle\psi|\alpha\rangle$。

完备性关系：
$$|0\rangle\langle0|+|1\rangle\langle1|=I$$

#### 运算性质
$$\big(|\psi\rangle\langle\phi|\big)|\chi\rangle=|\psi\rangle\big(\langle\phi|\chi\rangle\big)$$
> 可以把内积$\langle\phi|\chi\rangle$当作常数提出，狄拉克符号化简最常用技巧

### 2.3 内积 / 外积 / 张量积 三者区分（重点）
- 内积 $\langle\phi|\psi\rangle$：矢量 × 矢量 → 标量（复数）
- 外积 $|\psi\rangle\langle\phi|$：矢量 × 矢量 → 矩阵（算子）
- 张量积 $|\psi\rangle\otimes|\phi\rangle$：两个矢量组合，构造复合系统量子态

$$
|\psi\rangle=\begin{pmatrix}\psi_0\\\psi_1\end{pmatrix},\quad
|\phi\rangle=\begin{pmatrix}\phi_0\\\phi_1\end{pmatrix}
$$
$$
|\psi\rangle\otimes|\phi\rangle=
\begin{pmatrix}
\psi_0\phi_0\\
\psi_0\phi_1\\
\psi_1\phi_0\\
\psi_1\phi_1
\end{pmatrix}
\in\mathbb{C}^4
$$

一句话总结：
> 内积压缩维度得到数；外积升维得到算子；张量积构造复合系统态矢量。

### 2.4 双量子比特混合示例
双比特态 $|\psi\rangle=|0\rangle\otimes|1\rangle=|01\rangle$
算子 $A=|0\rangle\langle0|\otimes I$
$$
A|01\rangle=\big(|0\rangle\langle0|\otimes I\big)\big(|0\rangle\otimes|1\rangle\big)
=|0\rangle\langle0|0\rangle\otimes I|1\rangle
=|0\rangle\otimes|1\rangle
$$

### 2.5 厄米共轭 $\dagger$：左矢与右矢
$\dagger$ 厄米共轭：**先取复共轭，再转置**
右矢$|\psi\rangle$是列向量；左矢$\langle\psi|=|\psi\rangle^\dagger$，是行向量。

例1：实系数 $|+\rangle=\frac{1}{\sqrt{2}}(|0\rangle+|1\rangle)$
$$
|+\rangle=\frac{1}{\sqrt{2}}\begin{pmatrix}1\\1\end{pmatrix}
$$
$$
\langle+|=|+\rangle^\dagger=\frac{1}{\sqrt{2}}(1,1)
$$
$$
\langle+|+\rangle=\frac12(1\cdot1+1\cdot1)=1
$$

例2：带虚数的量子态（易错点）
$$
|\psi\rangle=\frac{1}{\sqrt{2}}(|0\rangle+i|1\rangle)=\frac{1}{\sqrt{2}}\begin{pmatrix}1\\i\end{pmatrix}
$$
每个元素取复共轭：$1^*=1,i^*=-i$，再转置
$$
\langle\psi|=|\psi\rangle^\dagger=\frac{1}{\sqrt{2}}(1,-i)
$$
> ❗虚部必须变号，否则归一化失效

$$
\langle\psi|\psi\rangle=\frac12\left[1\cdot1+(-i)\cdot i\right]=\frac12(1+1)=1
$$

例3：计算基
$$
|0\rangle=\begin{pmatrix}1\\0\end{pmatrix},\langle0|=|0\rangle^\dagger=(1,0)
$$
$$
|1\rangle=\begin{pmatrix}0\\1\end{pmatrix},\langle1|=|1\rangle^\dagger=(0,1)
$$

对比：
- $|\psi\rangle$：列向量，量子态
- $\langle\psi|$：共轭转置后的行向量，对偶空间
- $\dagger$（厄米共轭）≠普通转置$T$，复数态不能只用简单转置

## 3 自测习题
1. $\langle0|\big(|+\rangle\langle+|\big)|1\rangle$ 的结果是什么？
2. 外积 $|+\rangle\langle-|$ 对应的矩阵怎么写？
3. 内积和外积哪个满足交换律？

> 练习：$|\phi\rangle=\frac12\begin{pmatrix}1+i\\1-i\end{pmatrix}$，求对应的左矢 $\langle\phi|$

## 4 迹与密度矩阵（量子信息核心，QAE必备）
> 密度矩阵用来描述混合态；迹是求平均、计算保真度的基础，量子自编码器损失函数大量用到。

### 4.1 迹（Trace）定义
方阵 $\rho$ 的迹 $\mathrm{tr}(\rho)$：主对角线所有元素相加。
$$
\mathrm{tr}(\rho)=\sum_i \rho_{ii}
$$

#### 核心性质
1. 线性：$\mathrm{tr}(aA+bB)=a\cdot\mathrm{tr}(A)+b\cdot\mathrm{tr}(B)$
2. 循环置换不变性（**最重要**）
$$
\mathrm{tr}(AB)=\mathrm{tr}(BA),\quad \mathrm{tr}(ABC)=\mathrm{tr}(BCA)=\mathrm{tr}(CAB)
$$
> 矩阵顺序可以循环轮换，不能随意颠倒。这个性质在化简算子、求期望值高频使用。
3. 厄米共轭：$\mathrm{tr}(A^\dagger)=\big(\mathrm{tr}(A)\big)^*$
4. 前面克罗内克积性质回顾：$\mathrm{tr}(A\otimes B)=\mathrm{tr}(A)\cdot\mathrm{tr}(B)$

#### 迹和外积的关系
对任意右矢 $|\psi\rangle$，外积 $\rho=|\psi\rangle\langle\psi|$（纯态密度矩阵）
$$
\mathrm{tr}\big(|\psi\rangle\langle\psi|\big)=\langle\psi|\psi\rangle
$$
证明：
$$
\mathrm{tr}\big(|\psi\rangle\langle\psi|\big)=\mathrm{tr}\big(\langle\psi|\psi\rangle\big)=\langle\psi|\psi\rangle
$$
> 物理意义：纯态密度矩阵迹等于1（归一化量子态）。

#### 期望值用迹表示（量子力学标准写法）
可观测量算子 $M$，在态 $\rho$ 下的期望值：
$$
\langle M\rangle=\mathrm{tr}(\rho M)
$$
纯态 $\rho=|\psi\rangle\langle\psi|$ 时：
$$
\mathrm{tr}(|\psi\rangle\langle\psi|M)=\mathrm{tr}(\langle\psi|M|\psi\rangle)=\langle\psi|M|\psi\rangle
$$

### 4.2 密度矩阵（密度算子）
密度矩阵描述量子态，分为**纯态**与**混合态**。
- 纯态：可以写成单个右矢外积 $\rho=|\psi\rangle\langle\psi|$
- 混合态：多个纯态以经典概率加权：$\rho=\sum_i p_i |\psi_i\rangle\langle\psi_i\rangle,\ \sum p_i=1$

#### 密度矩阵三条基本公理
1. 迹条件：$\mathrm{tr}(\rho)=1$，总概率为1
2. 半正定：对任意 $|\phi\rangle$，$\langle\phi|\rho|\phi\rangle\ge0$
3. 厄米：$\rho^\dagger=\rho$，密度矩阵一定是厄米矩阵

#### 纯态判定
$\rho$ 是纯态 $\iff \mathrm{tr}(\rho^2)=1$；
混合态满足 $\mathrm{tr}(\rho^2)<1$。

例子：单量子比特纯态 $|0\rangle$
$$
\rho=|0\rangle\langle0|=\begin{pmatrix}1 & 0\\0 & 0\end{pmatrix}
$$
$$
\mathrm{tr}(\rho)=1,\quad \rho^2=\rho,\quad \mathrm{tr}(\rho^2)=1
$$

例子：混合态，50%概率$|0\rangle$、50%概率$|1\rangle$
$$
\rho=\frac12|0\rangle\langle0|+\frac12|1\rangle\langle1|=\begin{pmatrix}0.5 & 0\\0 & 0.5\end{pmatrix}
$$
$$
\rho^2=\begin{pmatrix}0.25 & 0\\0 & 0.25\end{pmatrix},\quad \mathrm{tr}(\rho^2)=0.5<1
$$

### 4.3 约化密度矩阵（QAE核心！）
多量子比特复合系统，只关心其中一部分量子比特，需要求**约化密度矩阵**，操作叫**求迹（偏迹 partial trace）**。

复合系统 $\rho_{AB}$，A、B两组量子比特。
- $\rho_A=\mathrm{tr}_B(\rho_{AB})$：对B子系统求偏迹，得到A子系统的约化密度矩阵
- $\rho_B=\mathrm{tr}_A(\rho_{AB})$：对A子系统求偏迹，得到B子系统的约化密度矩阵

> 量子自编码器QAE原理：全部量子比特 = 输入比特 + 隐比特。训练时，对丢弃的辅助比特做偏迹，取出隐比特子系统的约化密度矩阵，再计算保真度作为损失。

简单例子：双量子比特 $\rho=|\psi\rangle\langle\psi|,\ |\psi\rangle=|0\rangle_A\otimes|1\rangle_B$
$$
\rho_{AB}=|0\rangle_A\langle0|\otimes|1\rangle_B\langle1|
$$
对B求偏迹：
$$
\rho_A=\mathrm{tr}_B(\rho_{AB})=|0\rangle_A\langle0|\cdot\mathrm{tr}(|1\rangle\langle1|)=|0\rangle\langle0|
$$

### 4.4 保真度 Fidelity（QAE损失函数核心）
两个密度矩阵 $\rho,\sigma$ 之间保真度定义：
$$
F(\rho,\sigma)=\left(\mathrm{tr}\left(\sqrt{\sqrt{\rho}\sigma\sqrt{\rho}}\right)\right)^2
$$
当其中一个是纯态 $\sigma=|\phi\rangle\langle\phi|$，公式简化（非常常用）：
$$
F(\rho,|\phi\rangle\langle\phi|)=\langle\phi|\rho|\phi\rangle
$$

性质：
- $0\le F\le1$
- $F=1$：两个量子态完全相同；$F=0$：两个态完全正交

QAE损失设计思路：
$$
\mathcal{L}=1-F
$$
最小化损失等价最大化保真度，让编码后的隐态和目标态尽可能接近。

### 4.5 自测习题
1. 已知 $\rho=\frac12|0\rangle\langle0|+\frac12|+\rangle\langle+|$，求 $\mathrm{tr}(\rho)$ 和 $\mathrm{tr}(\rho^2)$，判断是纯态还是混合态？
2. 双量子比特态 $|\Psi\rangle=\frac{1}{\sqrt{2}}(|00\rangle+|11\rangle)$，写出密度矩阵，对子系统B求偏迹得到 $\rho_A$。
3. 纯态 $\rho=|\psi\rangle\langle\psi|$，证明 $\mathrm{tr}(\rho^2)=1$。

## 5 迹距离 Trace Distance（量子态距离，QAE评估指标）
> 迹距离用来衡量两个量子态之间的“可区分程度”，是量子信息中最基础的距离度量，和保真度成对使用，常用于评估量子自编码器编码前后态的差异。

### 5.1 定义
两个密度矩阵 $\rho,\sigma$ 的迹距离定义：
$$
D(\rho,\sigma)=\frac12\mathrm{tr}\big(|\rho-\sigma|\big)
$$
记号 $|A|=\sqrt{A^\dagger A}$，是矩阵的正平方根。

对于单量子比特，用布洛赫矢量表示会非常直观：
设
$$
\rho=\frac12(I+\vec{r}\cdot\vec{\sigma}),\quad \sigma=\frac12(I+\vec{s}\cdot\vec{\sigma})
$$
则迹距离：
$$
D(\rho,\sigma)=\frac12\|\vec{r}-\vec{s}\|_2
$$
$\vec{r},\vec{s}$ 为布洛赫矢量，$\|\cdot\|_2$ 是欧氏2范数。

### 5.2 核心性质
1. 范围：$0\le D(\rho,\sigma)\le1$
   - $D=0$：$\rho=\sigma$，两个量子态完全一样，无法区分
   - $D=1$：两个态完全正交，一次测量就可以100%区分
2. 对称性：$D(\rho,\sigma)=D(\sigma,\rho)$
3. 凸性、压缩性：量子操作不会增大迹距离。经过任意量子通道（酉变换、测量等）后，两个态之间的迹距离只会不变或者变小。
4. 三角不等式：$D(\rho,\sigma)\le D(\rho,\tau)+D(\tau,\sigma)$

### 5.3 和保真度的关系（重要，QAE实验分析常用）
F是保真度，D是迹距离，满足Fuchs-van de Graaf不等式：
$$
1-\sqrt{F}\le D(\rho,\sigma)\le\sqrt{1-F}
$$
- 迹距离描述**最大可区分概率**：两个态做最优测量，成功区分二者的最大概率等于 $\frac12 + \frac12 D(\rho,\sigma)$。
- 保真度偏向描述“重叠程度”；迹距离偏向描述“区分难易”。

### 5.4 简单示例
例1：$\rho=|0\rangle\langle0|,\ \sigma=|1\rangle\langle1|$
$$
\rho-\sigma=\begin{pmatrix}1 & 0\\0 & -1\end{pmatrix},\quad |\rho-\sigma|=\begin{pmatrix}1 & 0\\0 & 1\end{pmatrix}
$$
$$
D=\frac12\mathrm{tr}(I)=\frac12(1+1)=1
$$
迹距离等于1，完全可区分。

例2：$\rho=\sigma$，则 $D=0$。

例3：$\rho=|0\rangle\langle0|,\ \sigma=|+\rangle\langle+|$
$$
\rho=\begin{pmatrix}1 & 0\\0 & 0\end{pmatrix},\quad \sigma=\frac12\begin{pmatrix}1 & 1\\1 & 1\end{pmatrix}
$$
$$
\rho-\sigma=\begin{pmatrix}\frac12 & -\frac12\\-\frac12 & -\frac12\end{pmatrix}
$$
计算特征值：$\lambda_1=\frac{\sqrt{2}}{2},\lambda_2=-\frac{\sqrt{2}}{2}$
$$
|\rho-\sigma|=\begin{pmatrix}\frac{\sqrt2}{2}&0\\0&\frac{\sqrt2}{2}\end{pmatrix},\quad D=\frac12\left(\frac{\sqrt2}{2}+\frac{\sqrt2}{2}\right)=\frac{\sqrt2}{2}\approx0.707
$$

### 5.5 在QAE中的用途
训练时我们用保真度构造损失 $L=1-F$；
**评估阶段**可以用迹距离作为额外评价指标：计算原始输入态和编码-解码重构态之间的迹距离，用来量化重构误差。迹距离越小，代表重构出来的量子态越接近原始态。

### 5.6 自测习题
1. 两个相同的量子态，迹距离等于多少？两个正交纯态，迹距离等于多少？
2. 已知单量子比特布洛赫矢量 $\vec{r}=(0,0,1)$，$\vec{s}=(0,0,-1)$，求迹距离。

## 6 布洛赫球面 Bloch Sphere（单量子比特几何表示）
> 布洛赫球面把抽象的2维复量子态转化为3维实空间上的点，非常直观，理解单量子比特旋转门、迹距离、保真度必备。仅适用于单量子比特。

### 6.1 基本形式
任意单量子比特纯态 $|\psi\rangle$ 都可以写成：
$$
|\psi\rangle = \cos\frac{\theta}{2}|0\rangle + e^{i\phi}\sin\frac{\theta}{2}|1\rangle
$$
- $\theta\in[0,\pi]$：极角，从z轴正方向往下
- $\phi\in[0,2\pi)$：方位角，在xy平面内绕z轴旋转

对应的布洛赫矢量 $\vec{r}=(x,y,z)$：
$$
\begin{cases}
x=\sin\theta\cos\phi\\
y=\sin\theta\sin\phi\\
z=\cos\theta
\end{cases}
$$
布洛赫矢量长度 $||\vec{r}||_2=1$，所有纯态落在单位球面表面。

密度矩阵用布洛赫矢量表示：
$$
\rho=\frac12\left(I+\vec{r}\cdot\vec{\sigma}\right)
$$
$\vec{\sigma}=(\sigma_x,\sigma_y,\sigma_z)$ 是泡利算子矢量。

### 6.2 泡利矩阵
$$
\sigma_x=\begin{pmatrix}0 & 1\\1 & 0\end{pmatrix},\quad
\sigma_y=\begin{pmatrix}0 & -i\\i & 0\end{pmatrix},\quad
\sigma_z=\begin{pmatrix}1 & 0\\0 & -1\end{pmatrix}
$$

常用态在布洛赫球面的位置：
- $|0\rangle$：$\theta=0,\phi=0$，$\vec{r}=(0,0,1)$，球面北极
- $|1\rangle$：$\theta=\pi,\phi=0$，$\vec{r}=(0,0,-1)$，球面南极
- $|+\rangle=\frac{1}{\sqrt2}(|0\rangle+|1\rangle)$：$\theta=\pi/2,\phi=0$，$\vec{r}=(1,0,0)$，x轴正方向
- $|-\rangle=\frac{1}{\sqrt2}(|0\rangle-|1\rangle)$：$\theta=\pi/2,\phi=\pi$，$\vec{r}=(-1,0,0)$，x轴负方向
- $|i+\rangle=\frac{1}{\sqrt2}(|0\rangle+i|1\rangle)$：$\theta=\pi/2,\phi=\pi/2$，$\vec{r}=(0,1,0)$，y轴正方向

> 混合态：布洛赫矢量长度 $||\vec{r}||_2<1$，落在球体内部（布洛赫球内）。

### 6.3 量子门对应布洛赫球变换
单比特旋转门本质就是布洛赫球上绕某根轴的旋转：
- $R_x(\theta)$：绕x轴旋转角度$\theta$
- $R_y(\theta)$：绕y轴旋转角度$\theta$
- $R_z(\theta)$：绕z轴旋转角度$\theta$

酉变换不改变布洛赫矢量的模长，只改变方向。
> 变分量子线路里的可训练参数，就是这些旋转门的旋转角，这正是QAE编码器、解码器线路的参数来源。

### 6.4 和前面知识点关联
1. 迹距离：$\displaystyle D(\rho,\sigma)=\frac12\|\vec{r}-\vec{s}\|_2$，两个布洛赫矢量之间欧氏距离的一半。
2. 保真度（两纯态）：$F=|\langle\psi|\phi\rangle|^2=\frac12(1+\vec{r}\cdot\vec{s})$，等于1加上布洛赫矢量点积再除以2。

### 6.5 自测习题
1. 写出 $|-\rangle$ 的布洛赫矢量，并写出它对应的密度矩阵。
2. 布洛赫矢量 $\vec{r}=(0.6,0,0)$，判断该态是纯态还是混合态？
3. 两个纯态布洛赫矢量 $\vec{r}_1=(0,0,1),\vec{r}_2=(1,0,0)$，计算保真度和迹距离。

---

## 7 量子门基础（QAE线路组件）
> 量子自编码器的编码器、解码器全部由量子门堆叠而成，分为单量子比特门与多量子比特门。

### 7.1 单量子比特门（酉算子 $U^\dagger U=I$）
1. 恒等门 $I$
$$
I=\begin{pmatrix}1 & 0\\0 & 1\end{pmatrix}
$$
作用：量子态不变。

2. X门（量子非门）
$$
X=\sigma_x=\begin{pmatrix}0 & 1\\1 & 0\end{pmatrix}
$$
$X|0\rangle=|1\rangle,\ X|1\rangle=|0\rangle$，布洛赫球绕x轴旋转$\pi$。

3. Y门
$$
Y=\sigma_y=\begin{pmatrix}0 & -i\\i & 0\end{pmatrix}
$$

4. Z门
$$
Z=\sigma_z=\begin{pmatrix}1 & 0\\0 & -1\end{pmatrix}
$$
$Z|0\rangle=|0\rangle,\ Z|1\rangle=-|1\rangle$，相位翻转。

5. 旋转门（**变分线路核心，可训练参数**）
$$
R_x(\theta)=\exp\left(-i\frac{\theta}{2}\sigma_x\right)=
\begin{pmatrix}
\cos\frac{\theta}{2} & -i\sin\frac{\theta}{2}\\
-i\sin\frac{\theta}{2} & \cos\frac{\theta}{2}
\end{pmatrix}
$$
$$
R_y(\theta)=\exp\left(-i\frac{\theta}{2}\sigma_y\right)=
\begin{pmatrix}
\cos\frac{\theta}{2} & -\sin\frac{\theta}{2}\\
\sin\frac{\theta}{2} & \cos\frac{\theta}{2}
\end{pmatrix}
$$
$$
R_z(\theta)=\exp\left(-i\frac{\theta}{2}\sigma_z\right)=
\begin{pmatrix}
e^{-i\theta/2} & 0\\
0 & e^{i\theta/2}
\end{pmatrix}
$$
$\theta$ 是可训练角度参数，QAE里面每一层单比特旋转就是这一类门。

6. H 哈达玛门
$$
H=\frac1{\sqrt2}\begin{pmatrix}1 & 1\\1 & -1\end{pmatrix}
$$
$H|0\rangle=|+\rangle,\ H|1\rangle=|-\rangle$，把计算基变成叠加态。

### 7.2 两量子比特门（产生纠缠）
CNOT 受控非门，QAE纠缠层最常用。
控制比特$c$，目标比特$t$：
- 若控制比特 $|0\rangle_c$：目标比特不变
- 若控制比特 $|1\rangle_c$：目标比特取反

矩阵表示（以c为第一个比特，t第二个比特）
$$
\text{CNOT}=
\begin{pmatrix}
1 & 0 & 0 & 0\\
0 & 1 & 0 & 0\\
0 & 0 & 0 & 1\\
0 & 0 & 1 & 0
\end{pmatrix}
$$
$$
\text{CNOT}|00\rangle=|00\rangle,\ \text{CNOT}|01\rangle=|01\rangle
$$
$$
\text{CNOT}|10\rangle=|11\rangle,\ \text{CNOT}|11\rangle=|10\rangle
$$

> 关键理解：单量子门只能改变单个量子比特内部的叠加，**CNOT才可以在不同量子比特之间建立量子纠缠**，也就是你前面代码环形纠缠里用到的门。

### 7.3 多比特算子张量积写法
两个量子比特，对第一个比特作用X，第二个比特I：算子写成 $X\otimes I$。
$$
(X\otimes I)|01\rangle = X|0\rangle\otimes I|1\rangle=|1\rangle\otimes|1\rangle=|11\rangle
$$

### 7.4 自测习题
1. 计算 $R_y(\pi/2)|0\rangle$，写出得到的量子态。
2. CNOT门作用在 $|10\rangle$ 结果是什么？
3. 算子 $U=H\otimes I$，作用在 $|00\rangle$ 得到什么态？
