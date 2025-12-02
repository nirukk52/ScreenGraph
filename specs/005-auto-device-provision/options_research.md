Self-Hosted Mobile Device Farms for Android (and iOS)

Solo developers have several open-source or low-cost options for running Android emulators (and to a limited extent iOS simulators) as a device farm. Key choices include OpenSTF/DeviceFarmer, GADS, Mobile Test Platform (MTP), containerized Android emulators (e.g. docker-android), and commercial on-prem solutions like Genymotion. Below we compare these by setup effort, performance/fidelity, dynamic scaling, Appium/WebDriver support, iOS feasibility, and cost. Tables at the end summarize the tradeoffs.

OpenSTF / DeviceFarmer

OpenSTF (Smartphone Test Farm) – now continued as DeviceFarmer – is a mature open-source web app for managing Android devices. It provides real-time control and screen streaming of connected devices via a browser 
github.com
. It supports Android 2.3.3 through 9.0 (API 10–28)
github.com
, with features like 30–40 FPS video streaming, multitouch, keyboard input, file explorer, and remote ADB access
github.com
. However, STF is Android-only (no built-in iOS support), and installation is non-trivial: it requires Node.js (only v8.x is supported), RethinkDB, ZeroMQ, etc.
github.com
. In practice, setup involves deploying multiple Docker containers or processes, which is heavy for one person. STF is also “heavy on the hardware side” and considered somewhat of a “money sink” in maintenance
github.com
.

Setup: Complex. The STF server stack (Node, RethinkDB, etc.) and client APKs must be installed and configured. Docker images exist but often require custom tuning.

Performance: High fidelity (real devices). Video streaming can reach ~30 FPS. Because it uses real hardware, fidelity is excellent.

Dynamic/Scaling: Devices must be physically plugged in (or emulators started externally). STF supports a booking/partition system, but adding/removing emulators dynamically requires custom orchestration. It does automatically “reset” or recreate devices between sessions
github.com
.

Appium/WebDriver: Not built-in, but any device reachable via ADB (e.g. adb connect) can be used by Appium. STF lets you expose a device’s ADB over TCP
github.com
, so Appium can attach to it as a normal Android device.

iOS: None. Community efforts tried adding iOS to STF (via WebDriverAgent), but official STF/DeviceFarmer does not support iOS out of the box
controlfloor.com
.

Cost: Free (open source), but requires provisioning hardware or VMs for the backend plus actual devices. Because STF is resource-hungry, infra/ops costs can be high
github.com
.

Effort vs Paid: Considerable. It’s very powerful for an Android device lab, but heavy to configure. For a single dev needing minimal effort, STF may be overkill. Paid alternatives (AWS Device Farm, BrowserStack, HeadSpin, etc.) offer easier setup but at hourly/device cost.

GADS (Open-Source Device Farm)

GADS is a newer open-source platform explicitly aimed at self-hosted device farms. It supports both Android and iOS (on macOS), plus Smart TVs (Samsung Tizen, LG WebOS) for automated tests
github.com
github.com
. GADS provides a browser-based “Hub” and “Provider” model: devices (real or emulated) register with a hub, and tests are routed via Appium to available devices.

Setup: Moderate. Binaries are provided for different OS. On Linux you install MongoDB and run the Go server; on macOS you can use the downloadable binary
github.com
. A GUI dashboard can help manage devices. No heavy external DB is needed beyond Mongo. GADS advertises “Easy Setup: Simple installation and configuration”
github.com
.

Performance: Very good. GADS streams high-quality screenshots (MJPEG/WebRTC) and supports real-time interaction for both Android and iOS
github.com
github.com
. Because it uses WebDriverAgent for iOS and standard emulators or devices for Android, the fidelity is that of actual OS simulators/devices.

Dynamic/Scaling: It can dynamically provision and reclaim devices. GADS has automated device provisioning and idle-device cleanup, and you can “reserve” and release devices via the UI. You can also configure some “keep-alive” instances and a busy timeout for tests. (Exact on/off behavior depends on how you configure your device “providers” – e.g. starting/stopping AVDs via scripts.)

Appium/WebDriver: Native support. GADS is explicitly Appium-compatible
github.com
. It can run each device with its own Appium server endpoint if desired, and it even can register as Selenium Grid 4 nodes. You simply point your Appium tests at the GADS hub URL.

iOS: Supported on macOS hosts. iOS simulators and devices can be managed via WebDriverAgent through GADS. (On Linux/Windows GADS only has limited iOS support because Xcode is needed
github.com
.) In practice, to use iOS you need a Mac running the GADS “Provider” for those devices.

Cost: Free (MIT/AGPL, though note some UI code is proprietary). You pay only for the host machine and any devices. Operationally easier than STF, but still requires Mac hardware for iOS or actual Android devices or emulator hosts.

Worth vs Paid: High. For a solo dev wanting dynamic Android testing, GADS is relatively easy to start (e.g. download and run the Linux binary). Getting iOS working is harder (need Mac); for that many teams fallback to cloud (AWS Device Farm, etc.). TV support is a bonus (automated-only for Tizen/WebOS). Overall, GADS is one of the most capable OSS solutions today
github.com
github.com
.

Mobile Test Platform (open-tool)

The open-tool/mobile-test-platform is an open-source Android emulator farm built around Docker. It does not support iOS or real devices – only Android emulator images. The platform consists of a Kotlin Spring Boot server and a CLI client. Major features include automatic device recreation after each test, health monitoring (auto-restart on crash), idle-device cleanup (auto-release), and dynamic reconfiguration
github.com
.

Setup: Requires Docker and a JVM. You build and run the farm-server (via Gradle or supplied scripts) and use provided Docker images for Android emulators. A desktop GUI is included for management. Overall, the architecture is a bit complex (multi-service), but detailed docs and a Quickstart script are provided.

Performance: The fidelity is that of stock Android emulators. You typically use Google’s Docker emulator images (e.g. via GCP’s emulator registry as shown), so performance is similar to running an AVD (hardware acceleration is possible with --device /dev/kvm). There is no remote video streaming; tests run headless via the CLI (which in turn drives apps on the emulator).

Dynamic/Scaling: Strong. The server lets you configure a max device count, and you can keep a certain number “warm”. When a test session ends (or times out), the device is automatically wiped and restarted clean
github.com
. You can provision multiple Android versions, and even define “keep-alive” pools per API level. All of this is managed via the server’s flags (e.g. --max_amount, --keep_alive_devices)
github.com
github.com
.

Appium/WebDriver: Partially. MTP is more geared to instrumentation tests (Marathon/Espresso), but because it uses standard Android emulator containers, you could run Appium against them by exposing the ADB ports. However, it is not built as a Selenium Grid node by default; it has its own CLI for running tests. (It can register with Selenium Grid 4, but that’s optional.)

iOS: None. Strictly Android.

Cost: Free (Apache-2.0). Infrastructure cost is basically a Linux server with Docker and sufficient CPU/RAM for up to ~10 emulators (which are CPU/GPU intensive).

Effort vs Paid: Medium. It’s more involved to set up than a single docker container, but it automates cleanup and can scale to many emulators. For a solo dev starting with 1–2 devices, it might be overkill; for 5–10+, it could pay off. There’s no iOS; in that case a cloud iOS provider or own Mac would be needed.

Docker-Android Images (e.g. budtmo/docker-android)

Instead of a full “farm”, a lightweight option is to use a prebuilt Android emulator Docker image. For example, budtmo/docker-android provides Ubuntu containers with an Android emulator and VNC server. You can run any number of containers (each one is one device), and access it via VNC or adb
github.com
. Key points:

Setup: Very easy. Install Docker, then docker run an image (e.g. -e EMULATOR_DEVICE="Samsung Galaxy S10"). No special orchestration needed. The container will start the emulator and expose ports (e.g. ADB on 5555, VNC on 6080)
github.com
.

Performance: Depends on the host. The images use KVM (--device /dev/kvm) for hardware acceleration, so performance can be good if the host CPU/GPU is capable
github.com
. You get a real AVD (e.g. Pixel, Galaxy) with standard skins and Google APIs
github.com
. There is an integrated noVNC so you can see the emulator screen in a browser.

Dynamic/Scaling: Each container is one emulator. You can start/stop containers as needed. Docker Compose or Kubernetes could be used for bigger scale (some community charts exist). However, there is no central manager; you’d have to script device allocation yourself.

Appium/WebDriver: Fully compatible. Inside the container a normal ADB is running, so Appium on the host can connect with adb connect <container-ip>:5555. Indeed, the project advertises that it can run UI tests with Appium (and Espresso)
github.com
.

iOS: No. Android only.

Cost: Free images (MIT). You pay only for the host machine. For 1–2 emulators, even a moderately powerful laptop or VM suffices. Running 5–10 emulators may require a beefier server or multiple hosts.

Worth vs Paid: High for quick experiments. This is arguably the lowest-effort approach to get an Android “device” on demand. There’s no pricing except compute. It lacks features like automatic teardown, but for a small team it may be “good enough.” (It’s essentially DIY compared to integrated farms.)
github.com
github.com
.

Genymotion On-Premise (Commercial)

Genymotion is a commercial Android emulator platform. The on-premise offering (“Genymotion Device Image”) lets you run Genymotion’s high-performance Android images on your own servers
genymotion.com
.

Setup: You must purchase a license (“Enterprise Plan”) and then install Genymotion software or VM image. Setup is simpler than STF/GADS (it’s a packaged solution) but requires contacting sales and handling licensing
genymotion.com
.

Performance/Fidelity: Very high. Genymotion uses VirtualBox (or cloud VMs) to virtualize Android, and their images are optimized for performance. It supports the latest Android versions and a wide range of device profiles. It also offers features like advanced sensor simulation (GPS, battery, network) in its Pro version
genymotion.com
genymotion.com
.

Dynamic/Scaling: Genymotion Desktop is single-instance (one machine). But Genymotion Device (the on-prem image) is meant to be deployed on multiple nodes. Presumably you can start/stop instances via their API/CLI to scale. They also offer cloud images on AWS/GCP for $0.50/hour. However, on your own hardware, dynamic scaling will depend on your orchestration (no open API is documented for on-prem).

Appium/WebDriver: Fully supported. Genymotion integrates with Appium and most CI tools (Jenkins, etc.). You simply connect Appium to the emulator like any Android device. It also has a cloud connector, but that’s for their SaaS.

iOS: None. Android only.

Cost: High. Genymotion Desktop Pro costs $412/year per user/workstation
genymotion.com
. On-premise pricing is “custom” and likely expensive for a small team
genymotion.com
. The cloud option is ~$0.50/device-hour.

Worth vs Paid: Genymotion offers great ease-of-use and performance, but the cost is steep for a solo dev. It’s easier than managing Android Studio emulators yourself, but unless you already have a volume license, a free solution may suffice. For scaling (10+ devices) in an enterprise, it makes sense; for 1 always-on device, it’s overkill.

Other Approaches (Appium Plugins, Selenium Grid, etc.)

Appium Device-Farm Plugin: The Appium Device-Farm plugin for Appium 2.0 allows remote management of multiple devices (Android, iOS, tvOS) through Appium. It is installed via npm and run as an Appium plugin (see example usage in [41]). This doesn’t itself host emulators; it orchestrates them. It’s very easy to set up if you already have devices or emulators attached to a machine. (You just start Appium with the plugin enabled, and it will balance sessions across available devices.) For example, a blog tutorial notes that with Appium 2 + this plugin “your device farm is ready” with just a few commands
medium.com
. It’s free and lightweight, but still requires underlying devices or emulator processes.

Selenium Grid (Appium Nodes): You can also use Selenium Grid 4 to manage Appium sessions. Run Appium servers (or GADS providers) as Grid nodes, and use Grid to get on-demand device allocation. This is relatively easy for Android or iOS simulators (e.g. appium --port 4723 registers to Grid), but again the infrastructure (Grid and Appium nodes) must be managed. It’s essentially DIY.

Raw AVD/Simulators: You could simply script Android emulators (via avdmanager/emulator CLI) on one or more Linux/Windows machines. For example, CI jobs can spin up an emulator, run Appium tests, then kill it. Apple’s Xcode allows headless iOS simulators on Mac (e.g. simctl commands). This requires significant custom scripting and is not a unified “farm”, but it is the lowest-cost (just OS resources).

Cloud Fallback: If iOS is “nice-to-have”, note that no good self-hosted iOS farm exists. A common strategy is using local Android emulators + outsourcing iOS to a cloud (BrowserStack, AWS Device Farm, or solutions like TestGrid or Tencent’s WeTest for real devices). This incurs usage fees but avoids buying Mac hardware. (HeadSpin and WeTest are commercial device-clouds; WeTest is not open-source or self-hosted.)

Comparison Table
Solution	Setup Ease	Device Support	Dynamic On/Off	Appium/WebDriver	iOS Support	Cost (SW + Ops)	Notes
OpenSTF / DeviceFarmer
github.com
	Hard – many components (Node/RethinkDB) to install	Android phones/tablets (real or emulators)
github.com
	Limited (booking system exists, but adding emulators requires manual setup)	Yes (via ADB adb connect)
github.com
	None (Android only)	Free (OSS) + devices/infra; high ops overhead
github.com
	Mature, browser UI, heavy to run
github.com

GADS
github.com
github.com
	Medium – run Go binary + Mongo; UI for config	Android (real/emulators) and iOS (devices/sim on Mac)
github.com
, plus smart TVs (Tizen/WebOS)	Good – auto-provisioning and cleanup, reserving devices	Native Appium/WebDriver support
github.com
	Yes on macOS (full iOS support via WebDriverAgent)
github.com
	Free (OSS) + hardware; moderate (needs Mac for iOS)	Actively developed; easiest multi-OS support
github.com
github.com

Mobile Test Platform (MTP)
github.com
	Medium/Hard – Spring Boot server + Docker emulators (Kotlin/Gradle stack)	Android emulators in Docker
github.com
	Strong – auto-recreate every use, health checks, idle cleanup
github.com
	Appium: not primary (uses Marathon/Espresso); could run Appium by exposing ADB	No (Android only)	Free (OSS) + Docker hosts; moderate	Designed for CI farms of Android emulators; newer project
Docker-Android (budtmo)
github.com
	Easy – pull/run Docker container (KVM-enabled)	Android emulators (various device skins)
github.com
	Manual (one container = one device; use scripts/K8s to scale)	Yes – supports Appium tests
github.com
 (adb connect)	No (Android only)	Free + any server/VM; low	Quickest way for 1–3 emulators; VNC included for debugging
Genymotion (On-Prem)
genymotion.com
	Easy – install prebuilt device image (license needed)	Android emulators (full range, latest OS)	Partial – can script VMs, but no open orchestrator	Yes – just like normal Android devices	No (Android only)	Commercial. ~$412/yr per user
genymotion.com
; custom quotes	High performance; professional support; expensive for small teams
Appium Device Farm Plugin
medium.com
	Very Easy – npm install plugin into Appium 2	Connects to any devices attached (Android, iOS, tvOS)	Yes – manages sessions on demand (runs in Appium)	Yes – it is an Appium extension	Same as underlying devices (can route to simulators if running)	Free; requires Appium server	Plugin only; does not host devices. Good for 1 machine with multiple devices
DIY (e.g. AVD + Selenium Grid)	Varies – scripting or Grid config required	Android AVDs; iOS Simulators on Mac	Manual (script emulator start/stop or use Grid)	Yes (via Appium nodes on Grid)	Only if you run simulators on Mac nodes	Free; just OS resources	Most manual; highly flexible; minimal software overhead

Table: Comparison of self-hosted device farm solutions (key features and trade-offs). Sources: OpenSTF docs
github.com
, GADS README
github.com
github.com
, MTP README
github.com
, Docker-Android project
github.com
github.com
, Genymotion site
genymotion.com
genymotion.com
.

Summary and Recommendations

For a single always-on emulator, the simplest path is usually a container image or desktop emulator. For example, run budtmo/docker-android on a Linux VM for an Android device (no cost beyond the VM)
github.com
github.com
. If you need iOS as well (on a Mac), consider setting up GADS on macOS, since it can manage iOS simulators via WebDriverAgent
github.com
github.com
.

As you scale to multiple devices (5–10+), solutions like Mobile Test Platform or OpenSTF/DeviceFarmer become attractive. MTP automates Android emulator recycling in Docker
github.com
, while OpenSTF (DeviceFarmer) provides a rich management UI (at the cost of complexity)
github.com
github.com
. GADS remains compelling if you need cross-platform (Android + iOS) with less setup overhead
github.com
github.com
.

Keep in mind that iOS testing is the hardest to self-host: none of the above (aside from GADS on Mac) offers a turnkey iOS farm. In practice, teams often combine a local Android farm with an external iOS cloud (or invest in Mac hardware).

Finally, weigh the effort vs paid alternatives: self-hosting is free to license, but you pay in admin time and infrastructure. Services like AWS Device Farm, BrowserStack, or Genymotion Cloud can offload that burden at the expense of usage fees (e.g. Genymotion’s cloud devices cost ~$0.50/hr). For experimental or small-scale use, the open solutions above should suffice; for enterprise-scale testing with SLAs, paid device farms or managed solutions may be “worth it” instead.