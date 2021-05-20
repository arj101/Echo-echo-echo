
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.35.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/Checkbox.svelte generated by Svelte v3.35.0 */

    const file$1 = "src/Checkbox.svelte";

    // (13:4) {:else}
    function create_else_block$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = "./Chkbox_unchecked.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "checkbox_unchecked");
    			attr_dev(img, "class", "svelte-1rl214m");
    			add_location(img, file$1, 13, 6, 245);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(13:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (10:4) {#if checked}
    function create_if_block$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = "./Chkbox_checked.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "checkbox_checked");
    			attr_dev(img, "class", "svelte-1rl214m");
    			add_location(img, file$1, 10, 6, 163);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(10:4) {#if checked}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*checked*/ ctx[0]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if_block.c();
    			attr_dev(button, "class", "svelte-1rl214m");
    			add_location(button, file$1, 8, 0, 102);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if_block.m(button, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*onClick*/ ctx[1], false, false, false),
    					listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Checkbox", slots, []);
    	let { checked = false } = $$props;

    	function onClick() {
    		$$invalidate(0, checked = !checked);
    	}

    	const writable_props = ["checked"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Checkbox> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("checked" in $$props) $$invalidate(0, checked = $$props.checked);
    	};

    	$$self.$capture_state = () => ({ checked, onClick });

    	$$self.$inject_state = $$props => {
    		if ("checked" in $$props) $$invalidate(0, checked = $$props.checked);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [checked, onClick, click_handler];
    }

    class Checkbox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { checked: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Checkbox",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get checked() {
    		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function convertFromAv(text, recursionLevel) {
      text = text.split(" ").join("").toLowerCase();
      let currIdx = 0;
      let convertedText = "";
      while (currIdx < text.length) {
        let [char, avLength] = convertAvToChar(text.slice(currIdx));
        convertedText += char + " ";
        currIdx += avLength;
      }
      if (recursionLevel > 1) {
        recursionLevel--;
        return convertFromAv(convertedText, recursionLevel);
      }
      return convertedText;
    }


    function convertAvToChar(av) {
      switch (true) {
        case av.startsWith("alpha"): return ["A", 5];
        case av.startsWith("bravo"): return ["B", 5];
        case av.startsWith("charlie"): return ["C", 7];
        case av.startsWith("delta"): return ["D", 5];
        case av.startsWith("echo"): return ["E", 4];
        case av.startsWith("foxtrot"): return ["F", 7];
        case av.startsWith("golf"): return ["G", 4];
        case av.startsWith("hotel"): return ["H", 5];
        case av.startsWith("india"): return ["I", 5];
        case av.startsWith("juliett"): return ["J", 7];
        case av.startsWith("kilo"): return ["K", 4];
        case av.startsWith("lima"): return ["L", 4];
        case av.startsWith("mike"): return ["M", 4];
        case av.startsWith("november"): return ["N", 8];
        case av.startsWith("oscar"): return ["O", 5];
        case av.startsWith("papa"): return ["P", 4];
        case av.startsWith("quebec"): return ["Q", 6];
        case av.startsWith("romeo"): return ["R", 5];
        case av.startsWith("sierra"): return ["S", 6];
        case av.startsWith("tango"): return ["T", 5];
        case av.startsWith("uniform"): return ["U", 7];
        case av.startsWith("victor"): return ["V", 6];
        case av.startsWith("whiskey"): return ["W", 7];
        case av.startsWith("x-ray"): return ["X", 5];
        case av.startsWith("yankee"): return ["Y", 6];
        case av.startsWith("zulu"): return ["Z", 4];
        default: return [av[0].toUpperCase(), 1];
      }
    }

    function convertToAv(text, recursionLevel) {
      text = text.split("");
      let convertedText = "";
      text.forEach((c) => {
        convertedText += convertCharToAv(c) + " ";
      });
      convertedText = convertedText.split(" ").filter((c) => c != " ").join(" ");
      if (recursionLevel > 1) {
        recursionLevel--;
        return convertToAv(convertedText, recursionLevel);
      } else {
        return convertedText;
      }
    }

    function convertCharToAv(c) {
      switch (c.toLowerCase()) {
        case 'a': return "Alpha";
        case 'b': return "Bravo";
        case 'c': return "Charlie";
        case 'd': return "Delta";
        case 'e': return "Echo";
        case 'f': return "Foxtrot";
        case 'g': return "Golf";
        case 'h': return "Hotel";
        case 'i': return "India";
        case 'j': return "Juliett";
        case 'k': return "Kilo";
        case 'l': return "Lima";
        case 'm': return "Mike";
        case 'n': return "November";
        case 'o': return "Oscar";
        case 'p': return "Papa";
        case 'q': return "Quebec";
        case 'r': return "Romeo";
        case 's': return "Sierra";
        case 't': return "Tango";
        case 'u': return "Uniform";
        case 'v': return "Victor";
        case 'w': return "Whiskey";
        case 'x': return "X-ray";
        case 'y': return "Yankee";
        case 'z': return "Zulu";
        default: return c.toUpperCase();
      }
    }

    /* src/App.svelte generated by Svelte v3.35.0 */

    const { document: document_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    // (146:2) {:else}
    function create_else_block_1(ctx) {
    	let meta;

    	const block = {
    		c: function create() {
    			meta = element("meta");
    			attr_dev(meta, "name", "theme-color");
    			attr_dev(meta, "content", "white");
    			attr_dev(meta, "class", "svelte-rp6rwa");
    			add_location(meta, file, 146, 4, 3791);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, meta, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(meta);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(146:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (144:2) {#if colourNavbar}
    function create_if_block_6(ctx) {
    	let meta;

    	const block = {
    		c: function create() {
    			meta = element("meta");
    			attr_dev(meta, "name", "theme-color");
    			attr_dev(meta, "content", "hsla(263, 53%, 58%, 1)");
    			attr_dev(meta, "class", "svelte-rp6rwa");
    			add_location(meta, file, 144, 4, 3716);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, meta, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(meta);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(144:2) {#if colourNavbar}",
    		ctx
    	});

    	return block;
    }

    // (151:0) {#if !colourNavbar}
    function create_if_block_5(ctx) {
    	let style;

    	const block = {
    		c: function create() {
    			style = element("style");
    			style.textContent = "main {\n      box-shadow: rgba(0, 0, 0, 0.3) 0px 19px 38px, rgba(0, 0, 0, 0.22) 0px 15px 12px;\n    }";
    			attr_dev(style, "media", "screen");
    			attr_dev(style, "class", "svelte-rp6rwa");
    			add_location(style, file, 151, 2, 3881);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, style, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(style);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(151:0) {#if !colourNavbar}",
    		ctx
    	});

    	return block;
    }

    // (181:6) {#each convertedText as char}
    function create_each_block(ctx) {
    	let span;
    	let t_value = /*char*/ ctx[20] + "";
    	let t;
    	let span_intro;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "svelte-rp6rwa");
    			add_location(span, file, 181, 8, 4711);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*convertedText*/ 128 && t_value !== (t_value = /*char*/ ctx[20] + "")) set_data_dev(t, t_value);
    		},
    		i: function intro(local) {
    			if (!span_intro) {
    				add_render_callback(() => {
    					span_intro = create_in_transition(span, fade, {});
    					span_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(181:6) {#each convertedText as char}",
    		ctx
    	});

    	return block;
    }

    // (209:0) {#if settingsMenuState}
    function create_if_block_3(ctx) {
    	let div2;
    	let div0;
    	let label0;
    	let t0;
    	let t1;
    	let t2;
    	let input_1;
    	let t3;
    	let div1;
    	let label1;
    	let t5;
    	let checkbox;
    	let t6;
    	let div2_intro;
    	let div2_outro;
    	let t7;
    	let div3;
    	let div3_intro;
    	let div3_outro;
    	let current;
    	let mounted;
    	let dispose;

    	checkbox = new Checkbox({
    			props: { checked: /*reverseMode*/ ctx[3] },
    			$$inline: true
    		});

    	checkbox.$on("click", /*toggleReverseMode*/ ctx[11]);
    	let if_block = /*reverseMode*/ ctx[3] && create_if_block_4(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			t0 = text("Recursion level: ");
    			t1 = text(/*recursionLevel*/ ctx[1]);
    			t2 = space();
    			input_1 = element("input");
    			t3 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Reverse mode";
    			t5 = space();
    			create_component(checkbox.$$.fragment);
    			t6 = space();
    			if (if_block) if_block.c();
    			t7 = space();
    			div3 = element("div");
    			attr_dev(label0, "class", "settings-label svelte-rp6rwa");
    			attr_dev(label0, "for", "recurs-lvl-set");
    			add_location(label0, file, 215, 6, 6092);
    			attr_dev(input_1, "type", "range");
    			attr_dev(input_1, "min", "1");
    			attr_dev(input_1, "max", "3");
    			attr_dev(input_1, "id", "recurs-lvl-set");
    			attr_dev(input_1, "class", "svelte-rp6rwa");
    			add_location(input_1, file, 218, 6, 6207);
    			attr_dev(div0, "class", "settings-options svelte-rp6rwa");
    			add_location(div0, file, 214, 4, 6055);
    			attr_dev(label1, "class", "settings-label svelte-rp6rwa");
    			add_location(label1, file, 228, 6, 6447);
    			attr_dev(div1, "class", "settings-options svelte-rp6rwa");
    			set_style(div1, "margin-top", "2rem");
    			add_location(div1, file, 227, 4, 6383);
    			attr_dev(div2, "id", "settings-menu");
    			attr_dev(div2, "class", "svelte-rp6rwa");
    			add_location(div2, file, 209, 2, 5938);
    			attr_dev(div3, "id", "background-dimmer");
    			attr_dev(div3, "class", "svelte-rp6rwa");
    			add_location(div3, file, 241, 2, 6870);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, label0);
    			append_dev(label0, t0);
    			append_dev(label0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, input_1);
    			set_input_value(input_1, /*recursionLevel*/ ctx[1]);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t5);
    			mount_component(checkbox, div1, null);
    			append_dev(div1, t6);
    			if (if_block) if_block.m(div1, null);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div3, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input_1, "change", /*input_1_change_input_handler*/ ctx[16]),
    					listen_dev(input_1, "input", /*input_1_change_input_handler*/ ctx[16]),
    					listen_dev(input_1, "change", /*onInput*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*recursionLevel*/ 2) set_data_dev(t1, /*recursionLevel*/ ctx[1]);

    			if (dirty & /*recursionLevel*/ 2) {
    				set_input_value(input_1, /*recursionLevel*/ ctx[1]);
    			}

    			const checkbox_changes = {};
    			if (dirty & /*reverseMode*/ 8) checkbox_changes.checked = /*reverseMode*/ ctx[3];
    			checkbox.$set(checkbox_changes);

    			if (/*reverseMode*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*reverseMode*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkbox.$$.fragment, local);
    			transition_in(if_block);

    			add_render_callback(() => {
    				if (div2_outro) div2_outro.end(1);
    				if (!div2_intro) div2_intro = create_in_transition(div2, fly, { y: -300, duration: 400 });
    				div2_intro.start();
    			});

    			add_render_callback(() => {
    				if (div3_outro) div3_outro.end(1);
    				if (!div3_intro) div3_intro = create_in_transition(div3, fly, { y: -100, duration: 300 });
    				div3_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox.$$.fragment, local);
    			transition_out(if_block);
    			if (div2_intro) div2_intro.invalidate();
    			div2_outro = create_out_transition(div2, fly, { y: -300, duration: 700 });
    			if (div3_intro) div3_intro.invalidate();
    			div3_outro = create_out_transition(div3, fly, { y: -100, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(checkbox);
    			if (if_block) if_block.d();
    			if (detaching && div2_outro) div2_outro.end();
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div3);
    			if (detaching && div3_outro) div3_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(209:0) {#if settingsMenuState}",
    		ctx
    	});

    	return block;
    }

    // (233:6) {#if reverseMode}
    function create_if_block_4(ctx) {
    	let label;
    	let label_intro;
    	let label_outro;
    	let t1;
    	let checkbox;
    	let current;

    	checkbox = new Checkbox({
    			props: { checked: /*addSpaceBetweenChars*/ ctx[4] },
    			$$inline: true
    		});

    	checkbox.$on("click", /*toggleSpaceInbetween*/ ctx[12]);

    	const block = {
    		c: function create() {
    			label = element("label");
    			label.textContent = "Space characters";
    			t1 = space();
    			create_component(checkbox.$$.fragment);
    			attr_dev(label, "class", "settings-label svelte-rp6rwa");
    			add_location(label, file, 233, 6, 6613);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(checkbox, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const checkbox_changes = {};
    			if (dirty & /*addSpaceBetweenChars*/ 16) checkbox_changes.checked = /*addSpaceBetweenChars*/ ctx[4];
    			checkbox.$set(checkbox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (label_outro) label_outro.end(1);
    				if (!label_intro) label_intro = create_in_transition(label, fly, { x: -100, duration: 300 });
    				label_intro.start();
    			});

    			transition_in(checkbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (label_intro) label_intro.invalidate();
    			label_outro = create_out_transition(label, fly, { x: 100, duration: 300 });
    			transition_out(checkbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (detaching && label_outro) label_outro.end();
    			if (detaching) detach_dev(t1);
    			destroy_component(checkbox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(233:6) {#if reverseMode}",
    		ctx
    	});

    	return block;
    }

    // (247:0) {#if showCopyIndicator}
    function create_if_block_2(ctx) {
    	let div;
    	let p;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Copied!";
    			attr_dev(p, "class", "svelte-rp6rwa");
    			add_location(p, file, 248, 4, 7118);
    			attr_dev(div, "id", "copy-indicator");
    			attr_dev(div, "class", "svelte-rp6rwa");
    			add_location(div, file, 247, 2, 7019);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { y: 100, duration: 200 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, { y: 100, duration: 400 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(247:0) {#if showCopyIndicator}",
    		ctx
    	});

    	return block;
    }

    // (259:0) {:else}
    function create_else_block(ctx) {
    	let style;

    	const block = {
    		c: function create() {
    			style = element("style");
    			style.textContent = "#output {\n      word-break: break-word;\n    }";
    			attr_dev(style, "class", "svelte-rp6rwa");
    			add_location(style, file, 259, 2, 7247);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, style, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(style);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(259:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (253:0) {#if reverseMode}
    function create_if_block_1(ctx) {
    	let style;

    	const block = {
    		c: function create() {
    			style = element("style");
    			style.textContent = "#output {\n      word-break: break-all;\n    }";
    			attr_dev(style, "class", "svelte-rp6rwa");
    			add_location(style, file, 253, 2, 7169);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, style, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(style);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(253:0) {#if reverseMode}",
    		ctx
    	});

    	return block;
    }

    // (267:0) {#if settingsMenuState}
    function create_if_block(ctx) {
    	let style;

    	const block = {
    		c: function create() {
    			style = element("style");
    			style.textContent = "#content, #plen, #copy-button, #copy-indicator{\n      pointer-events: none;\n    }\n    body {\n      overflow: hidden;\n    }";
    			attr_dev(style, "class", "svelte-rp6rwa");
    			add_location(style, file, 267, 2, 7349);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, style, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(style);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(267:0) {#if settingsMenuState}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let if_block0_anchor;
    	let t0;
    	let t1;
    	let main;
    	let header;
    	let h1;
    	let span0;
    	let t3;
    	let span1;
    	let t5;
    	let span2;
    	let t7;
    	let button0;
    	let img0;
    	let img0_src_value;
    	let t8;
    	let div0;
    	let input0;
    	let t9;
    	let p;
    	let t10;
    	let button1;
    	let img1;
    	let img1_src_value;
    	let t11;
    	let button2;
    	let img2;
    	let img2_src_value;
    	let t12;
    	let input1;
    	let t13;
    	let div1;
    	let img3;
    	let img3_src_value;
    	let t14;
    	let img4;
    	let img4_src_value;
    	let t15;
    	let img5;
    	let img5_src_value;
    	let t16;
    	let img6;
    	let img6_src_value;
    	let t17;
    	let svg;
    	let rect0;
    	let path;
    	let rect1;
    	let rect2;
    	let circle;
    	let t18;
    	let t19;
    	let t20;
    	let t21;
    	let if_block5_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*colourNavbar*/ ctx[8]) return create_if_block_6;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = !/*colourNavbar*/ ctx[8] && create_if_block_5(ctx);
    	let each_value = /*convertedText*/ ctx[7];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block2 = /*settingsMenuState*/ ctx[2] && create_if_block_3(ctx);
    	let if_block3 = /*showCopyIndicator*/ ctx[5] && create_if_block_2(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*reverseMode*/ ctx[3]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block4 = current_block_type_1(ctx);
    	let if_block5 = /*settingsMenuState*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if_block0.c();
    			if_block0_anchor = empty();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			main = element("main");
    			header = element("header");
    			h1 = element("h1");
    			span0 = element("span");
    			span0.textContent = "Echo";
    			t3 = space();
    			span1 = element("span");
    			span1.textContent = "Echo";
    			t5 = space();
    			span2 = element("span");
    			span2.textContent = "Echo";
    			t7 = space();
    			button0 = element("button");
    			img0 = element("img");
    			t8 = space();
    			div0 = element("div");
    			input0 = element("input");
    			t9 = space();
    			p = element("p");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t10 = space();
    			button1 = element("button");
    			img1 = element("img");
    			t11 = space();
    			button2 = element("button");
    			img2 = element("img");
    			t12 = space();
    			input1 = element("input");
    			t13 = space();
    			div1 = element("div");
    			img3 = element("img");
    			t14 = space();
    			img4 = element("img");
    			t15 = space();
    			img5 = element("img");
    			t16 = space();
    			img6 = element("img");
    			t17 = space();
    			svg = svg_element("svg");
    			rect0 = svg_element("rect");
    			path = svg_element("path");
    			rect1 = svg_element("rect");
    			rect2 = svg_element("rect");
    			circle = svg_element("circle");
    			t18 = space();
    			if (if_block2) if_block2.c();
    			t19 = space();
    			if (if_block3) if_block3.c();
    			t20 = space();
    			if_block4.c();
    			t21 = space();
    			if (if_block5) if_block5.c();
    			if_block5_anchor = empty();
    			attr_dev(span0, "id", "e1");
    			attr_dev(span0, "class", "svelte-rp6rwa");
    			add_location(span0, file, 161, 6, 4082);
    			attr_dev(span1, "id", "e2");
    			attr_dev(span1, "class", "svelte-rp6rwa");
    			add_location(span1, file, 161, 32, 4108);
    			attr_dev(span2, "id", "e3");
    			attr_dev(span2, "class", "svelte-rp6rwa");
    			add_location(span2, file, 162, 6, 4140);
    			attr_dev(h1, "id", "title");
    			attr_dev(h1, "class", "svelte-rp6rwa");
    			add_location(h1, file, 160, 4, 4060);
    			if (img0.src !== (img0_src_value = "./Settings.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Settings");
    			attr_dev(img0, "id", "settings-svg");
    			attr_dev(img0, "class", "select-disable svelte-rp6rwa");
    			add_location(img0, file, 165, 7, 4235);
    			attr_dev(button0, "id", "settings");
    			attr_dev(button0, "class", "svelte-rp6rwa");
    			add_location(button0, file, 164, 4, 4180);
    			attr_dev(header, "id", "topbar");
    			attr_dev(header, "class", "svelte-rp6rwa");
    			add_location(header, file, 159, 2, 4035);
    			attr_dev(input0, "class", "input svelte-rp6rwa");
    			attr_dev(input0, "placeholder", /*placeholder*/ ctx[6]);
    			add_location(input0, file, 177, 6, 4553);
    			attr_dev(p, "id", "output");
    			attr_dev(p, "class", "svelte-rp6rwa");
    			add_location(p, file, 179, 4, 4651);
    			attr_dev(div0, "id", "content");
    			attr_dev(div0, "class", "svelte-rp6rwa");
    			add_location(div0, file, 173, 2, 4386);
    			if (img1.src !== (img1_src_value = "./Copy.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Copy");
    			attr_dev(img1, "class", "svelte-rp6rwa");
    			add_location(img1, file, 185, 49, 4820);
    			attr_dev(button1, "id", "copy-button");
    			attr_dev(button1, "class", "svelte-rp6rwa");
    			add_location(button1, file, 185, 2, 4773);
    			if (img2.src !== (img2_src_value = "./Clear.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Clear");
    			attr_dev(img2, "class", "svelte-rp6rwa");
    			add_location(img2, file, 186, 50, 4913);
    			attr_dev(button2, "id", "clear-button");
    			attr_dev(button2, "class", "svelte-rp6rwa");
    			add_location(button2, file, 186, 2, 4865);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "copy-area");
    			attr_dev(input1, "class", "ssshhhh-Im-for-copying svelte-rp6rwa");
    			input1.value = /*convertedText*/ ctx[7];
    			input1.readOnly = true;
    			add_location(input1, file, 187, 2, 4960);
    			attr_dev(img3, "class", "preloader svelte-rp6rwa");
    			if (img3.src !== (img3_src_value = "./cursor1.png")) attr_dev(img3, "src", img3_src_value);
    			add_location(img3, file, 190, 4, 5107);
    			attr_dev(img4, "class", "preloader svelte-rp6rwa");
    			if (img4.src !== (img4_src_value = "./cursor2.png")) attr_dev(img4, "src", img4_src_value);
    			add_location(img4, file, 191, 4, 5155);
    			attr_dev(img5, "class", "preloader svelte-rp6rwa");
    			if (img5.src !== (img5_src_value = "./Chkbox_checked.svg")) attr_dev(img5, "src", img5_src_value);
    			add_location(img5, file, 192, 4, 5203);
    			attr_dev(img6, "class", "preloader svelte-rp6rwa");
    			if (img6.src !== (img6_src_value = "./Chkbox_unchecked.svg")) attr_dev(img6, "src", img6_src_value);
    			add_location(img6, file, 193, 4, 5258);
    			attr_dev(div1, "id", "preloading-area");
    			attr_dev(div1, "clas", "ssshhhh");
    			attr_dev(div1, "class", "svelte-rp6rwa");
    			add_location(div1, file, 189, 2, 5061);
    			attr_dev(rect0, "width", "1152");
    			attr_dev(rect0, "height", "502");
    			attr_dev(rect0, "fill", "white");
    			attr_dev(rect0, "class", "svelte-rp6rwa");
    			add_location(rect0, file, 197, 2, 5427);
    			attr_dev(path, "id", "triangle");
    			attr_dev(path, "d", "M201.227 340.171L250.065 248.96L295.691 341.82L201.227 340.171Z");
    			attr_dev(path, "stroke", "#FFC1C1");
    			attr_dev(path, "stroke-width", "10");
    			attr_dev(path, "class", "svelte-rp6rwa");
    			add_location(path, file, 198, 2, 5476);
    			attr_dev(rect1, "id", "rect1");
    			attr_dev(rect1, "x", "703.869");
    			attr_dev(rect1, "y", "188.498");
    			attr_dev(rect1, "width", "90");
    			attr_dev(rect1, "height", "90");
    			attr_dev(rect1, "stroke", "#C1FFF4");
    			attr_dev(rect1, "stroke-width", "10");
    			attr_dev(rect1, "class", "svelte-rp6rwa");
    			add_location(rect1, file, 199, 2, 5603);
    			attr_dev(rect2, "id", "rect2");
    			attr_dev(rect2, "x", "930.437");
    			attr_dev(rect2, "y", "382.493");
    			attr_dev(rect2, "width", "32");
    			attr_dev(rect2, "height", "32");
    			attr_dev(rect2, "stroke", "#CEFFC1");
    			attr_dev(rect2, "stroke-width", "10");
    			attr_dev(rect2, "class", "svelte-rp6rwa");
    			add_location(rect2, file, 200, 2, 5706);
    			attr_dev(circle, "id", "circle");
    			attr_dev(circle, "cx", "1007");
    			attr_dev(circle, "cy", "68");
    			attr_dev(circle, "r", "15");
    			attr_dev(circle, "stroke", "#FFF9C1");
    			attr_dev(circle, "stroke-width", "10");
    			attr_dev(circle, "class", "svelte-rp6rwa");
    			add_location(circle, file, 201, 2, 5809);
    			attr_dev(svg, "width", "1152");
    			attr_dev(svg, "height", "502");
    			attr_dev(svg, "viewBox", "0 0 1152 502");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-rp6rwa");
    			add_location(svg, file, 196, 2, 5323);
    			attr_dev(main, "class", "svelte-rp6rwa");
    			add_location(main, file, 158, 0, 4026);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block0.m(document_1.head, null);
    			append_dev(document_1.head, if_block0_anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, header);
    			append_dev(header, h1);
    			append_dev(h1, span0);
    			append_dev(h1, t3);
    			append_dev(h1, span1);
    			append_dev(h1, t5);
    			append_dev(h1, span2);
    			append_dev(header, t7);
    			append_dev(header, button0);
    			append_dev(button0, img0);
    			append_dev(main, t8);
    			append_dev(main, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*input*/ ctx[0]);
    			append_dev(div0, t9);
    			append_dev(div0, p);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p, null);
    			}

    			append_dev(main, t10);
    			append_dev(main, button1);
    			append_dev(button1, img1);
    			append_dev(main, t11);
    			append_dev(main, button2);
    			append_dev(button2, img2);
    			append_dev(main, t12);
    			append_dev(main, input1);
    			append_dev(main, t13);
    			append_dev(main, div1);
    			append_dev(div1, img3);
    			append_dev(div1, t14);
    			append_dev(div1, img4);
    			append_dev(div1, t15);
    			append_dev(div1, img5);
    			append_dev(div1, t16);
    			append_dev(div1, img6);
    			append_dev(main, t17);
    			append_dev(main, svg);
    			append_dev(svg, rect0);
    			append_dev(svg, path);
    			append_dev(svg, rect1);
    			append_dev(svg, rect2);
    			append_dev(svg, circle);
    			insert_dev(target, t18, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t19, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t20, anchor);
    			if_block4.m(target, anchor);
    			insert_dev(target, t21, anchor);
    			if (if_block5) if_block5.m(target, anchor);
    			insert_dev(target, if_block5_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*toggleSettings*/ ctx[10], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[15]),
    					listen_dev(input0, "input", /*onInput*/ ctx[9], false, false, false),
    					listen_dev(button1, "click", /*copyOutput*/ ctx[13], false, false, false),
    					listen_dev(button2, "click", /*clearInput*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(if_block0_anchor.parentNode, if_block0_anchor);
    				}
    			}

    			if (!/*colourNavbar*/ ctx[8]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_5(ctx);
    					if_block1.c();
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (!current || dirty & /*placeholder*/ 64) {
    				attr_dev(input0, "placeholder", /*placeholder*/ ctx[6]);
    			}

    			if (dirty & /*input*/ 1 && input0.value !== /*input*/ ctx[0]) {
    				set_input_value(input0, /*input*/ ctx[0]);
    			}

    			if (dirty & /*convertedText*/ 128) {
    				each_value = /*convertedText*/ ctx[7];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(p, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!current || dirty & /*convertedText*/ 128 && input1.value !== /*convertedText*/ ctx[7]) {
    				prop_dev(input1, "value", /*convertedText*/ ctx[7]);
    			}

    			if (/*settingsMenuState*/ ctx[2]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*settingsMenuState*/ 4) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_3(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(t19.parentNode, t19);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*showCopyIndicator*/ ctx[5]) {
    				if (if_block3) {
    					if (dirty & /*showCopyIndicator*/ 32) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_2(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(t20.parentNode, t20);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (current_block_type_1 !== (current_block_type_1 = select_block_type_1(ctx))) {
    				if_block4.d(1);
    				if_block4 = current_block_type_1(ctx);

    				if (if_block4) {
    					if_block4.c();
    					if_block4.m(t21.parentNode, t21);
    				}
    			}

    			if (/*settingsMenuState*/ ctx[2]) {
    				if (if_block5) ; else {
    					if_block5 = create_if_block(ctx);
    					if_block5.c();
    					if_block5.m(if_block5_anchor.parentNode, if_block5_anchor);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block2);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block2);
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_block0.d(detaching);
    			detach_dev(if_block0_anchor);
    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t18);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t19);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t20);
    			if_block4.d(detaching);
    			if (detaching) detach_dev(t21);
    			if (if_block5) if_block5.d(detaching);
    			if (detaching) detach_dev(if_block5_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let input;
    	let recursionLevel = 1;
    	let settingsMenuState = false;
    	let reverseMode = false;
    	let addSpaceBetweenChars = false;
    	let showCopyIndicator = false;

    	const placeholders = [
    		"PHNL",
    		"PHOG",
    		"GECKO",
    		"BOOKE",
    		"ALANA",
    		"JULLE",
    		"SAKKI",
    		"LNY",
    		"MKK",
    		"PHNY"
    	];

    	let placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];
    	let convertedText = convertText(placeholder, recursionLevel);
    	let colourNavbar = false;

    	onMount(() => {
    		setTimeout(() => $$invalidate(8, colourNavbar = true), 1000);

    		document.addEventListener("keyup", e => {
    			if (e.ctrlKey && e.keyCode === 88) {
    				copyOutput();
    			}
    		});
    	});

    	function onInput() {
    		if (reverseMode) {
    			if (input) {
    				$$invalidate(7, convertedText = convertText(input, recursionLevel));
    			} else {
    				let outputFieldText = placeholders[Math.floor(Math.random() * placeholders.length)];
    				$$invalidate(6, placeholder = convertToAv(outputFieldText, recursionLevel));

    				if (addSpaceBetweenChars) {
    					$$invalidate(7, convertedText = outputFieldText.split("").join(" "));
    				} else {
    					$$invalidate(7, convertedText = outputFieldText);
    				}
    			}
    		} else {
    			if (input) {
    				$$invalidate(7, convertedText = convertToAv(input, recursionLevel));
    			} else {
    				$$invalidate(6, placeholder = placeholders[Math.floor(Math.random() * placeholders.length)]);
    				$$invalidate(7, convertedText = convertToAv(placeholder, recursionLevel));
    			}
    		}
    	}

    	function convertText(text, recursionLevel) {
    		let convertedText;

    		if (reverseMode) {
    			if (addSpaceBetweenChars) {
    				convertedText = convertFromAv(text, recursionLevel);
    			} else {
    				convertedText = convertFromAv(text, recursionLevel).split(" ");
    			}
    		} else {
    			convertedText = convertToAv(text, recursionLevel);
    		}

    		return convertedText;
    	}

    	function toggleSettings() {
    		$$invalidate(2, settingsMenuState = !settingsMenuState);
    	}

    	function updatePlaceholder() {
    		if (reverseMode) {
    			$$invalidate(6, placeholder = convertToAv(placeholders[Math.floor(Math.random() * placeholders.length)], recursionLevel));
    		} else {
    			$$invalidate(6, placeholder = placeholders[Math.floor(Math.random() * placeholders.length)]);
    		}
    	}

    	function toggleReverseMode() {
    		$$invalidate(3, reverseMode = !reverseMode);

    		if (reverseMode) {
    			let outputFieldText = placeholders[Math.floor(Math.random() * placeholders.length)];
    			$$invalidate(6, placeholder = convertToAv(outputFieldText, recursionLevel));

    			if (input) {
    				$$invalidate(7, convertedText = convertText(input, recursionLevel));
    			} else {
    				$$invalidate(7, convertedText = outputFieldText);
    			}
    		} else {
    			$$invalidate(6, placeholder = placeholders[Math.floor(Math.random() * placeholders.length)]);

    			if (input) {
    				$$invalidate(7, convertedText = convertToAv(input, recursionLevel));
    			} else {
    				$$invalidate(7, convertedText = convertToAv(placeholder, recursionLevel));
    			}
    		}
    	}

    	function toggleSpaceInbetween() {
    		$$invalidate(4, addSpaceBetweenChars = !addSpaceBetweenChars);
    		onInput();
    	}

    	function copyOutput() {
    		const inputElement = document.querySelector("#copy-area");
    		inputElement.select();
    		inputElement.setSelectionRange(0, 99999); /* For mobile devices */
    		document.execCommand("copy");

    		if (!showCopyIndicator) {
    			$$invalidate(5, showCopyIndicator = true);
    			setTimeout(() => $$invalidate(5, showCopyIndicator = false), 900);
    		}
    	}

    	function clearInput() {
    		if (input) {
    			$$invalidate(0, input = "");
    			onInput();
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		input = this.value;
    		$$invalidate(0, input);
    	}

    	function input_1_change_input_handler() {
    		recursionLevel = to_number(this.value);
    		$$invalidate(1, recursionLevel);
    	}

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		onMount,
    		Checkbox,
    		convertFromAv,
    		convertToAv,
    		input,
    		recursionLevel,
    		settingsMenuState,
    		reverseMode,
    		addSpaceBetweenChars,
    		showCopyIndicator,
    		placeholders,
    		placeholder,
    		convertedText,
    		colourNavbar,
    		onInput,
    		convertText,
    		toggleSettings,
    		updatePlaceholder,
    		toggleReverseMode,
    		toggleSpaceInbetween,
    		copyOutput,
    		clearInput
    	});

    	$$self.$inject_state = $$props => {
    		if ("input" in $$props) $$invalidate(0, input = $$props.input);
    		if ("recursionLevel" in $$props) $$invalidate(1, recursionLevel = $$props.recursionLevel);
    		if ("settingsMenuState" in $$props) $$invalidate(2, settingsMenuState = $$props.settingsMenuState);
    		if ("reverseMode" in $$props) $$invalidate(3, reverseMode = $$props.reverseMode);
    		if ("addSpaceBetweenChars" in $$props) $$invalidate(4, addSpaceBetweenChars = $$props.addSpaceBetweenChars);
    		if ("showCopyIndicator" in $$props) $$invalidate(5, showCopyIndicator = $$props.showCopyIndicator);
    		if ("placeholder" in $$props) $$invalidate(6, placeholder = $$props.placeholder);
    		if ("convertedText" in $$props) $$invalidate(7, convertedText = $$props.convertedText);
    		if ("colourNavbar" in $$props) $$invalidate(8, colourNavbar = $$props.colourNavbar);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		input,
    		recursionLevel,
    		settingsMenuState,
    		reverseMode,
    		addSpaceBetweenChars,
    		showCopyIndicator,
    		placeholder,
    		convertedText,
    		colourNavbar,
    		onInput,
    		toggleSettings,
    		toggleReverseMode,
    		toggleSpaceInbetween,
    		copyOutput,
    		clearInput,
    		input0_input_handler,
    		input_1_change_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    		target: document.body,
    		props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
