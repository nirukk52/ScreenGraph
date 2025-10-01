import androidx.compose.runtime.Composable
import org.jetbrains.compose.web.dom.H1
import org.jetbrains.compose.web.dom.Text
import org.jetbrains.compose.ui.ExperimentalComposeUiApi
import org.jetbrains.compose.ui.window.ComposeViewport

/**
 * Main entry for the WASM web UI. Renders a simple Hello World page.
 */
@OptIn(ExperimentalComposeUiApi::class)
fun main() {
    // Mount Compose into the root element
    ComposeViewport(viewportContainerId = "root") {
        App()
    }
}

/**
 * Root composable of the application.
 */
@Composable
fun App() {
    H1 { Text("Hello, ScreenGraph!") }
}
