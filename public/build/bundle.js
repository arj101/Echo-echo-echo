
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function () {
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
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }
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
    function init$2(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
    function create_else_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = "./Chkbox_unchecked.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "checkbox_unchecked");
    			attr_dev(img, "class", "svelte-1pdq4b9");
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
    		id: create_else_block.name,
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
    			attr_dev(img, "class", "svelte-1pdq4b9");
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
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if_block.c();
    			attr_dev(button, "class", "svelte-1pdq4b9");
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
    		init$2(this, options, instance$1, create_fragment$1, safe_not_equal, { checked: 0 });

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

    /* src/App.svelte generated by Svelte v3.35.0 */
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    // (131:6) {#each convertedText as char}
    function create_each_block(ctx) {
    	let span;
    	let t_value = /*char*/ ctx[17] + "";
    	let t;
    	let span_transition;
    	let current;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "svelte-1ixcpfl");
    			add_location(span, file, 131, 8, 3440);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*convertedText*/ 64) && t_value !== (t_value = /*char*/ ctx[17] + "")) set_data_dev(t, t_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!span_transition) span_transition = create_bidirectional_transition(span, fade, {}, true);
    				span_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!span_transition) span_transition = create_bidirectional_transition(span, fade, {}, false);
    			span_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching && span_transition) span_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(131:6) {#each convertedText as char}",
    		ctx
    	});

    	return block;
    }

    // (139:0) {#if settingsMenuState == true}
    function create_if_block(ctx) {
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
    	let current;
    	let mounted;
    	let dispose;

    	checkbox = new Checkbox({
    			props: { checked: /*reverseMode*/ ctx[3] },
    			$$inline: true
    		});

    	checkbox.$on("click", /*toggleReverseMode*/ ctx[9]);
    	let if_block = /*reverseMode*/ ctx[3] && create_if_block_1(ctx);

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
    			attr_dev(label0, "class", "settings-label svelte-1ixcpfl");
    			attr_dev(label0, "for", "recurs-lvl-set");
    			add_location(label0, file, 145, 6, 3775);
    			attr_dev(input_1, "type", "range");
    			attr_dev(input_1, "min", "1");
    			attr_dev(input_1, "max", "3");
    			attr_dev(input_1, "id", "recurs-lvl-set");
    			attr_dev(input_1, "class", "svelte-1ixcpfl");
    			add_location(input_1, file, 148, 6, 3890);
    			attr_dev(div0, "class", "settings-options svelte-1ixcpfl");
    			add_location(div0, file, 144, 4, 3738);
    			attr_dev(label1, "class", "settings-label svelte-1ixcpfl");
    			add_location(label1, file, 158, 6, 4130);
    			attr_dev(div1, "class", "settings-options svelte-1ixcpfl");
    			set_style(div1, "margin-top", "2rem");
    			add_location(div1, file, 157, 4, 4066);
    			attr_dev(div2, "id", "settings-menu");
    			attr_dev(div2, "class", "svelte-1ixcpfl");
    			add_location(div2, file, 139, 2, 3622);
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
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input_1, "change", /*input_1_change_input_handler*/ ctx[13]),
    					listen_dev(input_1, "input", /*input_1_change_input_handler*/ ctx[13]),
    					listen_dev(input_1, "change", /*onInput*/ ctx[7], false, false, false)
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
    					if_block = create_if_block_1(ctx);
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

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox.$$.fragment, local);
    			transition_out(if_block);
    			if (div2_intro) div2_intro.invalidate();
    			div2_outro = create_out_transition(div2, fly, { y: 300, duration: 300 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(checkbox);
    			if (if_block) if_block.d();
    			if (detaching && div2_outro) div2_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(139:0) {#if settingsMenuState == true}",
    		ctx
    	});

    	return block;
    }

    // (163:6) {#if reverseMode}
    function create_if_block_1(ctx) {
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

    	checkbox.$on("click", /*toggleSpaceInbetween*/ ctx[10]);

    	const block = {
    		c: function create() {
    			label = element("label");
    			label.textContent = "Add space between characters";
    			t1 = space();
    			create_component(checkbox.$$.fragment);
    			attr_dev(label, "class", "settings-label svelte-1ixcpfl");
    			add_location(label, file, 163, 6, 4296);
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(163:6) {#if reverseMode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let header;
    	let h1;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let span2;
    	let t5;
    	let button;
    	let img0;
    	let img0_src_value;
    	let t6;
    	let div;
    	let input_1;
    	let t7;
    	let p;
    	let t8;
    	let img1;
    	let img1_src_value;
    	let t9;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*convertedText*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block = /*settingsMenuState*/ ctx[2] == true && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			header = element("header");
    			h1 = element("h1");
    			span0 = element("span");
    			span0.textContent = "Echo";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Echo";
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "Echo";
    			t5 = space();
    			button = element("button");
    			img0 = element("img");
    			t6 = space();
    			div = element("div");
    			input_1 = element("input");
    			t7 = space();
    			p = element("p");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			img1 = element("img");
    			t9 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(span0, "id", "e1");
    			attr_dev(span0, "class", "svelte-1ixcpfl");
    			add_location(span0, file, 115, 6, 2976);
    			attr_dev(span1, "id", "e2");
    			attr_dev(span1, "class", "svelte-1ixcpfl");
    			add_location(span1, file, 115, 32, 3002);
    			attr_dev(span2, "id", "e3");
    			attr_dev(span2, "class", "svelte-1ixcpfl");
    			add_location(span2, file, 116, 6, 3034);
    			attr_dev(h1, "id", "title");
    			attr_dev(h1, "class", "svelte-1ixcpfl");
    			add_location(h1, file, 114, 4, 2954);
    			if (img0.src !== (img0_src_value = "./Settings.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Settings");
    			attr_dev(img0, "id", "settings-svg");
    			attr_dev(img0, "class", "select-disable svelte-1ixcpfl");
    			add_location(img0, file, 119, 7, 3129);
    			attr_dev(button, "id", "settings");
    			attr_dev(button, "class", "svelte-1ixcpfl");
    			add_location(button, file, 118, 4, 3074);
    			attr_dev(header, "id", "topbar");
    			attr_dev(header, "class", "svelte-1ixcpfl");
    			add_location(header, file, 113, 2, 2929);
    			attr_dev(input_1, "id", "input");
    			attr_dev(input_1, "placeholder", /*placeholder*/ ctx[5]);
    			attr_dev(input_1, "class", "svelte-1ixcpfl");
    			add_location(input_1, file, 128, 4, 3303);
    			attr_dev(p, "id", "output");
    			attr_dev(p, "class", "svelte-1ixcpfl");
    			add_location(p, file, 129, 4, 3380);
    			attr_dev(div, "id", "content");
    			attr_dev(div, "class", "svelte-1ixcpfl");
    			add_location(div, file, 127, 2, 3280);
    			attr_dev(img1, "id", "plen");
    			if (img1.src !== (img1_src_value = "./Plen.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Plen");
    			attr_dev(img1, "class", "select-disable svelte-1ixcpfl");
    			add_location(img1, file, 135, 2, 3510);
    			attr_dev(main, "class", "svelte-1ixcpfl");
    			add_location(main, file, 112, 0, 2920);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, header);
    			append_dev(header, h1);
    			append_dev(h1, span0);
    			append_dev(h1, t1);
    			append_dev(h1, span1);
    			append_dev(h1, t3);
    			append_dev(h1, span2);
    			append_dev(header, t5);
    			append_dev(header, button);
    			append_dev(button, img0);
    			append_dev(main, t6);
    			append_dev(main, div);
    			append_dev(div, input_1);
    			set_input_value(input_1, /*input*/ ctx[0]);
    			append_dev(div, t7);
    			append_dev(div, p);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p, null);
    			}

    			append_dev(main, t8);
    			append_dev(main, img1);
    			insert_dev(target, t9, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*toggleSettings*/ ctx[8], false, false, false),
    					listen_dev(input_1, "input", /*input_1_input_handler*/ ctx[12]),
    					listen_dev(input_1, "input", /*onInput*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*placeholder*/ 32) {
    				attr_dev(input_1, "placeholder", /*placeholder*/ ctx[5]);
    			}

    			if (dirty & /*input*/ 1 && input_1.value !== /*input*/ ctx[0]) {
    				set_input_value(input_1, /*input*/ ctx[0]);
    			}

    			if (dirty & /*convertedText*/ 64) {
    				each_value = /*convertedText*/ ctx[6];
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

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*settingsMenuState*/ ctx[2] == true) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*settingsMenuState*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
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

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t9);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let { convertToAv } = $$props;
    	let input;
    	let recursionLevel = 1;
    	let settingsMenuState = false;
    	let reverseMode = false;
    	let addSpaceBetweenChars = false;

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

    	function onInput() {
    		if (reverseMode) {
    			if (input) {
    				$$invalidate(6, convertedText = convertText(input, recursionLevel));
    			} else {
    				let outputFieldText = placeholders[Math.floor(Math.random() * placeholders.length)];
    				$$invalidate(5, placeholder = convertToAv(outputFieldText, recursionLevel));

    				if (addSpaceBetweenChars) {
    					$$invalidate(6, convertedText = outputFieldText.split("").join(" "));
    				} else {
    					$$invalidate(6, convertedText = outputFieldText);
    				}
    			}
    		} else {
    			if (input) {
    				$$invalidate(6, convertedText = convertToAv(input, recursionLevel));
    			} else {
    				$$invalidate(5, placeholder = placeholders[Math.floor(Math.random() * placeholders.length)]);
    				$$invalidate(6, convertedText = convertToAv(placeholder, recursionLevel));
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
    			$$invalidate(5, placeholder = convertToAv(placeholders[Math.floor(Math.random() * placeholders.length)], recursionLevel));
    		} else {
    			$$invalidate(5, placeholder = placeholders[Math.floor(Math.random() * placeholders.length)]);
    		}
    	}

    	function toggleReverseMode() {
    		$$invalidate(3, reverseMode = !reverseMode);

    		if (reverseMode) {
    			let outputFieldText = placeholders[Math.floor(Math.random() * placeholders.length)];
    			$$invalidate(5, placeholder = convertToAv(outputFieldText, recursionLevel));

    			if (input) {
    				$$invalidate(6, convertedText = convertText(input, recursionLevel));
    			} else {
    				$$invalidate(6, convertedText = outputFieldText);
    			}
    		} else {
    			$$invalidate(5, placeholder = placeholders[Math.floor(Math.random() * placeholders.length)]);

    			if (input) {
    				$$invalidate(6, convertedText = convertToAv(input, recursionLevel));
    			} else {
    				$$invalidate(6, convertedText = convertToAv(placeholder, recursionLevel));
    			}
    		}
    	}

    	function toggleSpaceInbetween() {
    		$$invalidate(4, addSpaceBetweenChars = !addSpaceBetweenChars);
    		onInput();
    	}

    	const writable_props = ["convertToAv"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_1_input_handler() {
    		input = this.value;
    		$$invalidate(0, input);
    	}

    	function input_1_change_input_handler() {
    		recursionLevel = to_number(this.value);
    		$$invalidate(1, recursionLevel);
    	}

    	$$self.$$set = $$props => {
    		if ("convertToAv" in $$props) $$invalidate(11, convertToAv = $$props.convertToAv);
    	};

    	$$self.$capture_state = () => ({
    		convertToAv,
    		fade,
    		fly,
    		Checkbox,
    		convertFromAv,
    		input,
    		recursionLevel,
    		settingsMenuState,
    		reverseMode,
    		addSpaceBetweenChars,
    		placeholders,
    		placeholder,
    		convertedText,
    		onInput,
    		convertText,
    		toggleSettings,
    		updatePlaceholder,
    		toggleReverseMode,
    		toggleSpaceInbetween
    	});

    	$$self.$inject_state = $$props => {
    		if ("convertToAv" in $$props) $$invalidate(11, convertToAv = $$props.convertToAv);
    		if ("input" in $$props) $$invalidate(0, input = $$props.input);
    		if ("recursionLevel" in $$props) $$invalidate(1, recursionLevel = $$props.recursionLevel);
    		if ("settingsMenuState" in $$props) $$invalidate(2, settingsMenuState = $$props.settingsMenuState);
    		if ("reverseMode" in $$props) $$invalidate(3, reverseMode = $$props.reverseMode);
    		if ("addSpaceBetweenChars" in $$props) $$invalidate(4, addSpaceBetweenChars = $$props.addSpaceBetweenChars);
    		if ("placeholder" in $$props) $$invalidate(5, placeholder = $$props.placeholder);
    		if ("convertedText" in $$props) $$invalidate(6, convertedText = $$props.convertedText);
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
    		placeholder,
    		convertedText,
    		onInput,
    		toggleSettings,
    		toggleReverseMode,
    		toggleSpaceInbetween,
    		convertToAv,
    		input_1_input_handler,
    		input_1_change_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$2(this, options, instance, create_fragment, safe_not_equal, { convertToAv: 11 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*convertToAv*/ ctx[11] === undefined && !("convertToAv" in props)) {
    			console.warn("<App> was created without expected prop 'convertToAv'");
    		}
    	}

    	get convertToAv() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set convertToAv(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let wasm;

    let WASM_VECTOR_LEN = 0;

    let cachegetUint8Memory0 = null;
    function getUint8Memory0() {
        if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
            cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachegetUint8Memory0;
    }

    let cachedTextEncoder = new TextEncoder('utf-8');

    const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
        ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view);
    }
        : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    });

    function passStringToWasm0(arg, malloc, realloc) {

        if (realloc === undefined) {
            const buf = cachedTextEncoder.encode(arg);
            const ptr = malloc(buf.length);
            getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
            WASM_VECTOR_LEN = buf.length;
            return ptr;
        }

        let len = arg.length;
        let ptr = malloc(len);

        const mem = getUint8Memory0();

        let offset = 0;

        for (; offset < len; offset++) {
            const code = arg.charCodeAt(offset);
            if (code > 0x7F) break;
            mem[ptr + offset] = code;
        }

        if (offset !== len) {
            if (offset !== 0) {
                arg = arg.slice(offset);
            }
            ptr = realloc(ptr, len, len = offset + arg.length * 3);
            const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
            const ret = encodeString(arg, view);

            offset += ret.written;
        }

        WASM_VECTOR_LEN = offset;
        return ptr;
    }

    let cachegetInt32Memory0 = null;
    function getInt32Memory0() {
        if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
            cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
        }
        return cachegetInt32Memory0;
    }

    let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

    cachedTextDecoder.decode();

    function getStringFromWasm0(ptr, len) {
        return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
    }
    /**
    * @param {string} text_
    * @param {number} recusrion_lvl
    * @returns {string}
    */
    function convert_to_av(text_, recusrion_lvl) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passStringToWasm0(text_, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.convert_to_av(retptr, ptr0, len0, recusrion_lvl);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(r0, r1);
        }
    }

    async function load(module, imports) {
        if (typeof Response === 'function' && module instanceof Response) {
            if (typeof WebAssembly.instantiateStreaming === 'function') {
                try {
                    return await WebAssembly.instantiateStreaming(module, imports);

                } catch (e) {
                    if (module.headers.get('Content-Type') != 'application/wasm') {
                        console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                    } else {
                        throw e;
                    }
                }
            }

            const bytes = await module.arrayBuffer();
            return await WebAssembly.instantiate(bytes, imports);

        } else {
            const instance = await WebAssembly.instantiate(module, imports);

            if (instance instanceof WebAssembly.Instance) {
                return { instance, module };

            } else {
                return instance;
            }
        }
    }

    async function init$1(input) {
        if (typeof input === 'undefined') {
            input = new URL('av_converter_bg.wasm', (document.currentScript && document.currentScript.src || new URL('bundle.js', document.baseURI).href));
        }
        const imports = {};


        if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
            input = fetch(input);
        }



        const { instance, module } = await load(await input, imports);

        wasm = instance.exports;
        init$1.__wbindgen_wasm_module = module;

        return wasm;
    }

    const init = async () => {
    	await init$1();

    	new App({
    		target: document.body,
    		props: {
    			name: 'world',
    			convertToAv: convert_to_av
    		}
    	});
    };

    init();

}());
//# sourceMappingURL=bundle.js.map
