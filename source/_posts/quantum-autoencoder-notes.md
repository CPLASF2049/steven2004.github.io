---
title: 量子自编码网络学习笔记
date: 2026-10-30 18:30:00
categories:
  - 学习笔记
tags:
  - 量子计算
  - 量子机器学习
  - 量子自编码器
  - QAE
  - 深度学习
description: 从经典自编码器（AE）到变分自编码器（VAE），再到量子自编码器（QAE）的完整脉络：偏迹压缩、参数化酉线路 U(θ)/V(φ)、保真度损失 1−F、参数移位法则与贫瘠高原。
index_img: /img/cover-quantum.jpg
banner_img: /img/cover-quantum.jpg
---

> 从经典自编码器 → 变分自编码器 → 量子自编码器（QAE）的完整脉络。
> 本笔记整合了之前调试 Cirq/PennyLane 代码、学习量子计算基础时沉淀的知识点（克罗内克积、狄拉克符号、密度矩阵、偏迹、保真度、VQC、参数移位法则等）。

前置阅读：{% post_link quantum-math-notes "量子机器学习前置数学基础笔记" %}

---

## 1 经典自编码器（Autoencoder, AE）

### 1.1 核心思想

自编码器是一类**无监督神经网络**，目标不是分类或回归，而是**让输出尽可能还原输入**。
结构由三部分组成：

1. **编码器 Encoder**：把高维输入 $\boldsymbol{x}\in\mathbb{R}^d$ 压缩到低维隐表示 $\boldsymbol{z}\in\mathbb{R}^h$（$h<d$）
2. **瓶颈层（隐空间）**：承载压缩后的核心信息
3. **解码器 Decoder**：从隐表示 $\boldsymbol{z}$ 还原回 $\hat{\boldsymbol{x}}$，维度与输入相同

$$
\boldsymbol{z}=\mathrm{enc}(\boldsymbol{x}),\qquad \hat{\boldsymbol{x}}=\mathrm{dec}(\boldsymbol{z})
$$

> 💡 通俗类比
> 就像一篇长文被提炼成几句"中心思想"，再从中心思想扩写回一篇长文。中间那句中心思想就是隐变量 $\boldsymbol{z}$。

![经典自编码器结构示意](/img/qae/classic-ae.png)

### 1.2 训练目标

最小化**重构误差**（输入和输出之间的差距）：

$$
\mathcal{L}=\mathrm{dist}(\boldsymbol{x},\hat{\boldsymbol{x}})
$$

常用距离度量：

- 均方误差（MSE，适合实数连续值）：$\mathcal{L}=\frac1d\sum_i(x_i-\hat{x}_i)^2$
- 交叉熵（适合二值/概率输出）：$\mathcal{L}=-\sum_i\big[x_i\log\hat{x}_i+(1-x_i)\log(1-\hat{x}_i)\big]$

训练时不断更新编码器、解码器的权重，使重构误差下降。

### 1.3 关键认识

1. 隐空间维度 $h$ 明显小于输入维度 $d$，**强迫网络学会"压缩"**，丢弃冗余、保留最关键特征。
2. 自编码器是**非线性 PCA** 的推广；线性激活时学到的最优解等价于 PCA。
3. 应用场景：**降维**、**特征提取**（预训练）、**去噪**（噪声输入→干净输出）、**异常检测**（重构误差大的样本视为异常）。

### 1.4 自编码器的局限（引出变分自编码器）

- 隐变量 $\boldsymbol{z}$ 是**确定性的**：同一个输入一定得到同一个隐向量。
- 隐空间**不一定连续、不一定有规律**：任意两个隐向量之间插值，解码结果可能毫无意义。
- 因此 AE 不能直接用于**生成**新样本（采样一个隐向量，解码出来不一定是合理的真实样本）。

---

## 2 变分自编码器（Variational Autoencoder, VAE）

### 2.1 解决什么问题

VAE 是 AE 的**概率化升级**，目的是让模型**能够生成**新样本。
核心改动：把隐变量从"确定值"改成"一个概率分布"。

![变分自编码器结构示意](/img/qae/vae.png)

### 2.2 核心思路（ELBO）

假设隐变量服从先验分布 $p(\boldsymbol{z})$（通常取标准正态分布 $\mathcal{N}(0,I)$）。
编码器不再直接输出一个 $\boldsymbol{z}$，而是输出隐变量的**分布参数**：

$$
\boldsymbol{z}\sim q_\phi(\boldsymbol{z}|\boldsymbol{x})=\mathcal{N}\big(\mu_\phi(\boldsymbol{x}),\ \sigma_\phi^2(\boldsymbol{x})\big)
$$

编码器输出的是均值 $\mu$ 和方差 $\sigma^2$，从这个分布中**采样**得到 $\boldsymbol{z}$。

优化目标是最小化"重构误差 + 正则项"，等价于最大化**证据下界 ELBO**：

$$
\mathcal{L}=\underbrace{\mathbb{E}_{q_\phi}\big[\log p_\theta(\boldsymbol{x}|\boldsymbol{z})\big]}_{\text{重构损失}} - \underbrace{D_{KL}\big(q_\phi(\boldsymbol{z}|\boldsymbol{x})\,\Vert\,p(\boldsymbol{z})\big)}_{\text{KL 散度正则项}}
$$

- **重构损失**：让解码器能从 $\boldsymbol{z}$ 还原输入，鼓励隐变量携带信息。
- **KL 散度**：让编码器输出的分布尽量贴近标准正态先验，**正则化隐空间**，使隐空间连续、有规律、可采样。

> 💡 通俗类比
> AE 是"记住答案"；VAE 是"学规律"。VAE 强迫隐变量符合一种标准分布，所以解码器随便从一个标准正态分布里采一个点，都能生成合理的样本。

### 2.3 重参数化技巧（Reparameterization Trick）

采样 $\boldsymbol{z}\sim\mathcal{N}(\mu,\sigma^2)$ 这一"随机"动作不可求导，无法反向传播。
技巧：把随机性转移到独立的噪声上

$$
\boldsymbol{z}=\mu+\sigma\odot\boldsymbol{\varepsilon},\qquad \boldsymbol{\varepsilon}\sim\mathcal{N}(0,I)
$$

这样 $\mu,\sigma$ 可以正常求梯度，随机性由固定噪声 $\boldsymbol{\varepsilon}$ 承担。

### 2.4 VAE vs AE 对比

| 维度 | AE | VAE |
|---|---|---|
| 隐变量 | 确定值 | 概率分布（均值+方差） |
| 损失 | 仅重构误差 | 重构误差 + KL 正则项 |
| 隐空间 | 可能不连续 | 连续、可采样 |
| 能否生成 | 不能 | 能（从先验采样） |
| 典型用途 | 降维、去噪、特征提取 | 生成式建模 |

> 关键点：VAE 的"变分"指用**变分推断**近似后验 $p(\boldsymbol{z}|\boldsymbol{x})$，用 $q_\phi$ 去逼近它。量子自编码器 QAE 的损失构造思路，正是借鉴了经典 AE（重构损失）和 VAE（正则化）的设计。

---

## 3 量子自编码器（Quantum Autoencoder, QAE）

### 3.1 要解决的问题

把**经典数据**或**量子态**压缩到更少的量子比特上，同时保证信息尽量不丢失。

QAE 将经典 AE 的"向量压缩"思想搬到了量子系统：

- 经典 AE：高维向量 → 编码器压缩到低维隐向量 → 解码器还原
- QAE：$k$ 个输入量子比特承载量子态 → 参数化酉编码器 $U(\theta)$ 压缩到 $n$ 个隐比特（$n<k$）→ 解码器 $V(\phi)$ 还原

### 3.2 系统设置与量子比特（衔接之前的代码）

- $k$：输入比特，承载原始量子态 $|\psi_{\text{in}}\rangle$
- $n$：隐比特，压缩后信息存储在这里
- 总比特数：$k+n$
- 初始全局态：$|\Psi_0\rangle=|\psi_{\text{in}}\rangle_{\text{input}}\otimes|0\rangle_{\text{latent}}$

> ⚠️ 量子比特 ≠ 数据存储。`GridQubit/LineQubit` 只是标记比特位置，所有比特初始化默认是 $|0\rangle$。想要得到目标量子态，**必须施加量子门做幺正演化**，而不是直接"赋值"。

### 3.3 编码器与解码器：参数化量子线路（VQC）

编码器 $U(\theta)$ 和解码器 $V(\phi)$ 都是**变分量子线路（VQC）**：

1. **单比特旋转层**：对每个量子比特施加 $R_x,R_y,R_z$ 旋转门
   - **旋转角度 $\theta$ 就是可训练参数**，等价于经典网络的权重
   - $R_y(\theta)|0\rangle$ 能把量子态在布洛赫球上转到任意位置
   - 每层每比特放几个旋转门（1/2/3 个）是 ansatz 的人为设计，参数总数随之改变

2. **纠缠层**：用 CNOT 门在比特之间建立量子纠缠
   - **没有纠缠，量子比特互相独立**，信息无法在比特之间传递，压缩根本不可能完成
   - 常见拓扑：线性链 `cx(q,q+1)`、环形环（线性链基础上补 `cx(n_input-1,0)` 首尾相连）
   - CNOT 无可训练参数，固定结构

3. 将「旋转层 + 纠缠层」重复 $n_{\text{layers}}$ 次，堆叠成完整线路

> 💡 通俗类比
> 旋转门负责"调整每个比特自己的状态"（相当于经典网络的逐元素变换）；
> CNOT 纠缠门负责"让不同比特之间交换信息"（相当于经典网络的矩阵乘法/特征交互）。
> 没有纠缠，编码器只能对每个比特独立旋转，永远无法把 2 比特信息压缩进 1 个隐比特。

![量子自编码器 QAE 量子线路示意](/img/qae/qae-circuit.png)

### 3.4 压缩的数学本质：偏迹（Partial Trace）

编码阶段，全局初始态经过编码器幺正演化：

$$
|\Psi_{\text{enc}}\rangle=U(\theta)\big(|\psi_{\text{in}}\rangle\otimes|0\rangle\big)
$$

要对"丢弃的输入比特"求迹（**偏迹**），取出隐比特子系统的**约化密度矩阵**：

$$
\rho_{\text{latent}}=\mathrm{tr}_{\text{input}}\big(|\Psi_{\text{enc}}\rangle\langle\Psi_{\text{enc}}|\big)
$$

$\rho_{\text{latent}}$ 就是压缩之后保留在隐比特里的全部信息。

> 💡 通俗类比
> 偏迹 = 把不关心的量子比特"平均掉/忽略掉"，只看剩下的隐比特。
> 就像一张合照，把其他人"P 掉"只留主角，主角的信息仍然保留。

![偏迹与约化密度矩阵示意](/img/qae/partial-trace.png)

### 3.5 损失函数与保真度

QAE 的损失有两种主流构造方案：

**方案 A：重构损失（完整编码-解码）**

完整线路：初始态 → 编码器 $U(\theta)$ → 解码器 $V(\phi)$，得到重构态 $|\Psi_{\text{recon}}\rangle$。
与原始输入态对比，用**保真度**度量：

$$
F=\big|\langle\Psi_0|\Psi_{\text{recon}}\rangle\big|^2
$$

损失：

$$
\mathcal{L}=1-F
$$

最小化损失 = 最大化保真度 = 让重构态尽量接近原始输入。

**方案 B：隐空间损失**

直接比较隐比特约化密度矩阵 $\rho_{\text{latent}}$ 与目标态的保真度。

> ⚠️ 踩坑点：两个密度矩阵**维度必须一致**才能算保真度，否则报错（之前 Cirq 报错正是这个原因）。

### 3.6 保真度与迹距离（评估指标）

**保真度 Fidelity**（度量"重叠程度"）：

$$
F(\rho,\sigma)=\Big(\mathrm{tr}\big(\sqrt{\sqrt{\rho}\,\sigma\sqrt{\rho}}\big)\Big)^2
$$

其中一个为纯态 $|\phi\rangle$ 时简化：$F(\rho,|\phi\rangle\langle\phi|)=\langle\phi|\rho|\phi\rangle$

**迹距离 Trace Distance**（度量"可区分程度"）：

$$
D(\rho,\sigma)=\frac12\mathrm{tr}\big(|\rho-\sigma|\big)
$$

两者满足 Fuchs–van de Graaf 不等式：

$$
1-\sqrt{F}\le D(\rho,\sigma)\le\sqrt{1-F}
$$

> 训练用保真度构造损失 $\mathcal{L}=1-F$；评估阶段可用迹距离量化重构误差。迹距离越小，重构态越接近原始态。

### 3.7 QAE 训练完整流程（对应之前代码）

1. 分配量子比特资源：$k$ 个输入比特 + $n$ 个隐比特
2. 构建编码器 ansatz（参数 $\theta$）和解码器 ansatz（参数 $\phi$），参数相互独立
3. 制备输入量子态（通过量子门，全部比特初始为 $|0\rangle$）
4. 运行完整线路（初始化 + 编码器 + 解码器），得到输出态矢
5. 计算损失（$1-F$，比较重构态与原始态）
6. 求梯度并更新全部 $\theta,\phi$
7. 迭代直到损失收敛

### 3.8 梯度计算：参数移位法则 vs 有限差分（科研重点）

- **有限差分**（Cirq demo 手写）

  $$
  \frac{\partial L}{\partial\theta}\approx\frac{L(\theta+\epsilon)-L(\theta-\epsilon)}{2\epsilon}
  $$

  数值近似，受 $\epsilon$ 影响，仅适合理想模拟器。

- **参数移位法则**（PennyLane 默认）

  $$
  \frac{\partial L}{\partial\theta}=\frac12\Big[L(\theta+\tfrac{\pi}{2})-L(\theta-\tfrac{\pi}{2})\Big]
  $$

  严格量子理论公式（生成元特征值为 $\pm1$ 的旋转门成立），不是近似。

> ⚠️ 为什么正式论文不用有限差分：真实 NISQ 硬件存在噪声，微小 $\epsilon$ 造成的损失变化会被噪声淹没，梯度完全失效。参数移位法则是量子机器学习论文的标准方案。

### 3.9 常见陷阱：贫瘠高原（Barren Plateau）

当量子比特数、线路层数很大时，损失函数的梯度会**指数级趋近 0**，参数几乎不更新，训练不动。

- 现象：损失不下降、梯度全接近 0；不是代码 bug，是变分线路固有现象。
- 缓解：不要盲目堆层数；选合适 ansatz；参数用小随机数初始化；优先局部代价函数。

### 3.10 仿真 vs 真实硬件（写论文必须写明的局限）

1. Cirq/PennyLane 是**理想无噪声态矢模拟**，结果是理论上界；真实硬件有门错误、退相干、读出噪声，性能会下降。
2. 模拟器可以"直接给态矢数组"当输入，这**只是仿真捷径，真实量子硬件做不到**——真实硬件只能通过量子门（微波脉冲）演化生成量子态。
3. 训练受贫瘠高原影响，比特数、层数不能无限增大。

### 3.11 QAE vs 经典 AE / VAE 对比总结

| 维度 | 经典 AE | VAE | 量子 AE (QAE) |
|---|---|---|---|
| 数据 | 实数向量 | 实数向量 | 量子态（叠加、纠缠） |
| 编码器 | 神经网络 | 神经网络（输出分布参数） | 参数化酉线路 $U(\theta)$ |
| 隐变量 | 确定值 | 概率分布 $q_\phi(\boldsymbol{z}\vert\boldsymbol{x})$ | 隐比特约化密度矩阵 $\rho_{\text{latent}}$ |
| 压缩手段 | 降维投影 | 降维 + 分布正则 | 偏迹丢弃输入比特自由度 |
| 解码器 | 神经网络 | 神经网络 | 参数化酉线路 $V(\phi)$ |
| 损失 | 重构误差 | 重构误差 + KL | $1-$ 保真度 |
| 可训练参数 | 权重矩阵 | 权重矩阵 | 旋转门角度 $\theta,\phi$ |

![AE / VAE / QAE 对照示意](/img/qae/ae-vae-qae.png)

> 💡 一句话总结 QAE
> 用参数化酉线路（旋转门提供可训练角度 + CNOT 提供纠缠）把 $k$ 个输入比特的量子信息压缩进 $n$ 个隐比特，再用解码器还原；通过最大化"重构态与原始态的保真度"来训练。偏迹是压缩的数学本质，保真度是评价指标。

---

## 附：本笔记用到的核心量子数学公式速查

| 概念 | 公式 / 说明 |
|---|---|
| 克罗内克积 | $(A\otimes B)(C\otimes D)=(AC)\otimes(BD)$；$\mathrm{tr}(A\otimes B)=\mathrm{tr}(A)\mathrm{tr}(B)$ |
| 内积 | $\langle\phi\vert\psi\rangle=\phi_0^*\psi_0+\phi_1^*\psi_1$（左矢是右矢的厄米共轭） |
| 外积 | $\vert\psi\rangle\langle\phi\vert$ 得到矩阵（算子）；$\phi=\psi$ 时为投影算子 |
| 张量积 | $\vert\psi\rangle\otimes\vert\phi\rangle$ 构造复合系统态矢量 |
| 密度矩阵 | 纯态 $\rho=\vert\psi\rangle\langle\psi\vert$；混合态 $\rho=\sum_i p_i\vert\psi_i\rangle\langle\psi_i\vert$ |
| 归一化 | $\mathrm{tr}(\rho)=1$；纯态 $\iff\mathrm{tr}(\rho^2)=1$ |
| 偏迹 | $\rho_A=\mathrm{tr}_B(\rho_{AB})$，忽略 B 子系统 |
| 保真度 | $F(\rho,\sigma)=\big(\mathrm{tr}\sqrt{\sqrt{\rho}\sigma\sqrt{\rho}}\big)^2$，$0\le F\le1$ |
| 迹距离 | $D(\rho,\sigma)=\frac12\mathrm{tr}\vert\rho-\sigma\vert$，$0\le D\le1$ |
| 布洛赫球 | $\vert\psi\rangle=\cos\frac\theta2\vert0\rangle+e^{i\phi}\sin\frac\theta2\vert1\rangle$；$\rho=\frac12(I+\vec{r}\cdot\vec{\sigma})$ |
| 旋转门 | $R_x(\theta)=\exp(-i\frac\theta2\sigma_x)$ 等，$\theta$ 是可训练参数 |
| CNOT | 控制比特为 $\vert1\rangle$ 时翻转目标比特，产生纠缠，无参数 |
