# 设计

### 流程分析

完整的一次火箭发射流程涉及到如下的步骤：

1. 新建、加入一个任务
2. 客户端在发射过程中不断发送 Action（对于火箭的操作），并且接受后端发来的 Event Result（事件响应），并将其显示在控制台上。

### 核心框架

程序的核心是前端与后端的交互的 Websocket，后端分为处理前端消息的 Handler 和后台持续运行的 MissionService，两者的指责：

1. Handler：从 Client 接受 Websocket 信息（Action），转化为 Event 发往 MissionService；从 MissionService 的 MessageChannel 中接受信息（WsMessage），将其发送回 Client。
2. MissionService：接受从 Handler 发来的 Event，将其加入 Event Queue；依次处理 EventQueue 中的 Event，并将处理结果广播给所有的 Client；在后台持续的记录遥测数据；依据 RocketSetting 调整 RocketStatus；处理外部事件。

Handler 和 MissionService 之间的通信通过 Channel 进行，流程如下：Client 连接 Server 时，Handler 从 MissionService 取得一个 Channel，这个 Channel 中的内容就是需要通过 Ws 传递给 Client 并被渲染到 Terminal 和 SystemStatus 中的内容。

而对于 Client 发来的请求，Handler 通过`AddEvent`方法传递给响应的 MissionService。

在 MissionService 中，除非任务终止，`adjustStatus`协程会根据 SystemSetting 更改 SystemStatus，并在到达临界值时触发 Diagnostic 和 Alarm，`telemetry`协程会每隔一段时间将飞船的当前状态打印到日志中，后续亦可以记录到时序数据库中。`accident`协程会根据创建任务的成功率计算累计事故率，并随机的触发外部事故。

通过这样的设计支持多用户、多任务的并发和并行，并分离 Ws 和 Mission 的程序逻辑。

### 飞船状态

飞船的状态（SystemStatus）受到这些量的控制：系统设置（SystemSettings 例如燃料、氧气、推力、速度等）；外部事件的直接干扰（Accident）。

### 事件处理

大部分的代码是对于事件的处理，事件分为如下的种类：

1. 简单事件：单次操作就可以完成，例如 Power 的开关、推力值的调整。
2. 复合事件：多个简单事件 + 简单事件持续时间的序列，典型：外部事件、自定义程序（AutoSeq 也认为是 System 字段为真的自定义程序）。

每一个 Event 都会在在数据库中记录，新加入的 Client 可以通过查询 Event 表重放 Terminal 上的 Log。复合事件一般会有子事件，子事件也会被记录在 Event 表中。

---

尽管大部分的事件都是异步发生的，但都是很简单的异步（从 Event Channel 入，从 Message Channel 出），只有 Diagnostic 和 Alarm 是特殊的，前端通过 EventTypeDiagnosticStart 触发后端执行诊断，诊断完成后通过 Ws 通知前端，前端根据通知的 DiagnosticID 从 RESTful Endpoint 获取 Diagnostic。

### 欠缺的地方

CRUD 类型的接口仅仅实现了 Mission 管理和 Diagnostic 获取，还需要实现：

- [ ] Presets 管理
- [ ] Event 历史获取
- [ ] CustomProgram 管理
- [ ] Accident 管理
- [ ] Alarm 管理
- [ ] 一些常见的优化（比如分页）
- [ ] 使用 Go embed 将前端嵌入后端中

Event Processor 缺少对于一些事件的处理，但是每一类的事件已经至少实现了一个实例。
