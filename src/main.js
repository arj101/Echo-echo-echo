import App from './App.svelte';
import wasm, {convert_to_av} from "../public/av_converter";


const init = async () => {
	await wasm();

	const app = new App({
		target: document.body,
		props: {
			convertToAv: convert_to_av
		}
	});
}

init();
