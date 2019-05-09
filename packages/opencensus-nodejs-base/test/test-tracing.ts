/**
 * Copyright 2019, OpenCensus Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as core from '@opencensus/core';
import {logger} from '@opencensus/core';
import * as assert from 'assert';
import {defaultConfig} from '../src/trace/config/default-config';
import {TracingBase} from '../src/trace/tracing-base';

const NOOP_EXPORTER = new core.NoopExporter();
describe('TracingBase', () => {
  /** Should create a TracingBase instance */
  describe('new TracingBase()', () => {
    it('should create a Tracer instance', () => {
      const tracing = new TracingBase();
      assert.ok(tracing instanceof TracingBase);
    });
  });

  /** Should get the singleton trancing instance. */
  describe('static get instance()', () => {
    it('should get the singleton trancing instance', () => {
      const tracing = TracingBase.instance;
      assert.ok(tracing instanceof TracingBase);
    });
  });

  /** Should return a started tracing instance */
  describe('start()', () => {
    let aTracingBase: core.Tracing;
    const tracing = new TracingBase();

    beforeEach(() => {
      if (tracing.active) {
        tracing.stop();
      }
    });

    it('should return a tracing instance', () => {
      aTracingBase = tracing.start();
      assert.ok(aTracingBase instanceof TracingBase);
      assert.ok(tracing.active);
      assert.ok(aTracingBase.tracer.active);
    });

    // TODO: Currently this test seems to need to change every time a new
    // configuration field is added.
    // Should be investigated a way to automatically do this

    describe('start with different config objects', () => {
      it('should start with default config', () => {
        tracing.start();
        assert.strictEqual(defaultConfig.bufferSize, tracing.config.bufferSize);
        assert.strictEqual(
            defaultConfig.bufferTimeout, tracing.config.bufferTimeout);
        assert.strictEqual(defaultConfig.logLevel, tracing.config.logLevel);
        assert.strictEqual(
            defaultConfig.maximumLabelValueSize,
            tracing.config.maximumLabelValueSize);
        assert.strictEqual(
            defaultConfig.samplingRate, tracing.config.samplingRate);
        assert.ok(tracing.config.plugins);
        if (tracing.config.plugins) {
          assert.deepEqual(
              tracing.config.plugins, {}, 'plugins are empty by default');
        }
        assert.strictEqual(
            defaultConfig.traceParams.numberOfAnnontationEventsPerSpan, 32);
        assert.strictEqual(
            defaultConfig.traceParams.numberOfAttributesPerSpan, 32);
        assert.strictEqual(defaultConfig.traceParams.numberOfLinksPerSpan, 32);
        assert.strictEqual(
            defaultConfig.traceParams.numberOfMessageEventsPerSpan, 128);
      });

      it('should start tracing with a non-default logLevel', () => {
        aTracingBase = tracing.start({logLevel: 3});
        assert.strictEqual(tracing.config.logLevel, 3);
        const consoleLogger =
            aTracingBase.tracer.logger as logger.ConsoleLogger;
        assert.strictEqual(consoleLogger.level, 'info');
      });

      it('should start tracing with a logger instance', () => {
        const aLogger = logger.logger('debug');
        aTracingBase = tracing.start({logger: aLogger});
        assert.strictEqual(tracing.config.logger, aLogger);
        const consoleLogger =
            aTracingBase.tracer.logger as logger.ConsoleLogger;
        assert.strictEqual(consoleLogger.level, 'debug');
      });

      it('should start with an exporter instance', () => {
        aTracingBase = tracing.start({exporter: NOOP_EXPORTER});
        assert.strictEqual(tracing.config.exporter, NOOP_EXPORTER);
        assert.strictEqual(aTracingBase.exporter, NOOP_EXPORTER);
      });

      it('should start with a non-default bufferSize', () => {
        const bufferSizeValue = defaultConfig.bufferSize + 1;
        tracing.start({bufferSize: bufferSizeValue});
        assert.strictEqual(tracing.config.bufferSize, bufferSizeValue);
      });

      it('should start with a non-default bufferTimeout', () => {
        const bufferTimeoutValue = defaultConfig.bufferTimeout + 100;
        tracing.start({bufferTimeout: bufferTimeoutValue});
        assert.strictEqual(tracing.config.bufferTimeout, bufferTimeoutValue);
      });

      it('should start with a non-default maximumLabelValueSize', () => {
        const maximumLabelValueSizeValue =
            defaultConfig.maximumLabelValueSize + 10;
        tracing.start({maximumLabelValueSize: maximumLabelValueSizeValue});
        assert.strictEqual(
            tracing.config.maximumLabelValueSize, maximumLabelValueSizeValue);
      });

      it('should start with a non-default samplingRate', () => {
        const samplingRateValue = defaultConfig.samplingRate / 100;
        tracing.start({samplingRate: samplingRateValue});
        assert.strictEqual(tracing.config.samplingRate, samplingRateValue);
      });

      it('should start with an user-provided plugin list', () => {
        const endUserPlugins = {
          'http': 'enduser-http-pluging',
          'simple-module': 'enduser-simple-module-pluging'
        };
        tracing.start({plugins: endUserPlugins});
        assert.ok(tracing.config.plugins);
        if (tracing.config.plugins) {
          // should overwrite default http plugin
          assert.strictEqual(
              tracing.config.plugins['http'], endUserPlugins['http']);
          // should add a new plugin
          assert.strictEqual(
              tracing.config.plugins['simple-module'],
              endUserPlugins['simple-module']);
        }
      });

      it('should start with a non-default traceparams', () => {
        tracing.start({
          traceParams: {
            numberOfAttributesPerSpan: 10,
            numberOfAnnontationEventsPerSpan: 5,
            numberOfLinksPerSpan: 8,
            numberOfMessageEventsPerSpan: 100
          }
        });
        assert.ok(tracing.config.traceParams);
        if (tracing.config.traceParams) {
          assert.strictEqual(
              tracing.config.traceParams.numberOfAttributesPerSpan, 10);
          assert.strictEqual(
              tracing.config.traceParams.numberOfAnnontationEventsPerSpan, 5);
          assert.strictEqual(
              tracing.config.traceParams.numberOfLinksPerSpan, 8);
          assert.strictEqual(
              tracing.config.traceParams.numberOfMessageEventsPerSpan, 100);
        }
      });

      it('should start with a non-default and default traceparams', () => {
        tracing.start({traceParams: {numberOfAttributesPerSpan: 10}});

        if (tracing.config.traceParams) {
          assert.strictEqual(
              tracing.config.traceParams.numberOfAttributesPerSpan, 10);
          assert.strictEqual(
              tracing.config.traceParams.numberOfAnnontationEventsPerSpan, 32);
          assert.strictEqual(
              tracing.config.traceParams.numberOfLinksPerSpan, 32);
          assert.strictEqual(
              tracing.config.traceParams.numberOfMessageEventsPerSpan, 128);
        }
      });
    });
  });

  /** Should stop the tracing instance */
  describe('stop()', () => {
    it('should stop the tracing instance', () => {
      const tracing = new TracingBase();
      tracing.start();
      assert.ok(tracing.config);
      assert.ok(tracing.tracer.active);
      tracing.stop();
      assert.ok(!tracing.tracer.active);
      assert.ok(tracing.exporter instanceof core.NoopExporter);
      assert.deepEqual(tracing.config, {});
    });
  });

  /** Should get the tracer instance */
  describe('get tracer()', () => {
    it('should get the tracer instance', () => {
      const tracing = new TracingBase();
      tracing.start();
      const tracer = tracing.tracer;
      assert.ok(tracer instanceof core.CoreTracerBase);
    });
  });

  /** Should get the exporter instance */
  describe('get exporter()', () => {
    it('should get the exporter instance', () => {
      const tracing = new TracingBase();
      tracing.start();
      const exporter = tracing.exporter;
      assert.ok(exporter instanceof core.ConsoleExporter);
    });
  });

  /** Should register the exporter instance */
  describe('registerExporter()', () => {
    it('should register the exporter on tracer', () => {
      const tracing = new TracingBase();
      tracing.start();
      const exporter = NOOP_EXPORTER;
      tracing.registerExporter(exporter);
      assert.strictEqual(tracing.config.exporter, exporter);
      assert.strictEqual(tracing.tracer.eventListeners.length, 1);
    });

    it('should not register twice the same exporter', () => {
      const tracing = new TracingBase();
      tracing.start();
      const exporter = NOOP_EXPORTER;
      tracing.registerExporter(exporter);
      assert.strictEqual(tracing.config.exporter, exporter);
      assert.strictEqual(tracing.tracer.eventListeners.length, 1);
      tracing.registerExporter(exporter);
      assert.strictEqual(tracing.tracer.eventListeners.length, 1);
    });

    it('should overwrite a new exporter', () => {
      const tracing = new TracingBase();
      tracing.start();
      const exporter = NOOP_EXPORTER;
      tracing.registerExporter(exporter);
      assert.strictEqual(tracing.config.exporter, exporter);
      assert.strictEqual(tracing.tracer.eventListeners.length, 1);
      const newExporter = new core.ConsoleExporter(defaultConfig);
      tracing.registerExporter(newExporter);
      assert.strictEqual(tracing.config.exporter, newExporter);
      assert.strictEqual(tracing.tracer.eventListeners.length, 1);
    });
  });

  /** Should unregister the exporter instance */
  describe('unregisterExporter()', () => {
    it('should unregister the exporter on tracer', () => {
      const tracing = new TracingBase();
      tracing.start();
      const exporter = NOOP_EXPORTER;
      tracing.registerExporter(exporter);
      assert.strictEqual(tracing.config.exporter, exporter);
      assert.strictEqual(tracing.tracer.eventListeners.length, 1);
      tracing.unregisterExporter(exporter);
      assert.ok(tracing.config.exporter instanceof core.NoopExporter);
      assert.strictEqual(tracing.tracer.eventListeners.length, 0);
    });
  });
});
