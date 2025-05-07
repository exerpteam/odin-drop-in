<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { OdinDropin } from '@exerp/odin-dropin';

// --- State ---
const odinPublicToken = ref('');
const dropinContainerRef = ref<HTMLElement | null>(null);
const paymentMethodId = ref<string | null>(null);
const errorMessage = ref<string | null>(null);
let odinDropinInstance: OdinDropin | null = null; // To store the instance

// --- Methods ---
async function initializeAndMountDropin() {
  paymentMethodId.value = null;
  errorMessage.value = null;
  console.log('Attempting to initialize Drop-in...');

  if (!odinPublicToken.value) {
    errorMessage.value = 'Please provide an ODIN Public Token.';
    return;
  }

  if (!dropinContainerRef.value) {
    errorMessage.value = 'Drop-in container element not found.'; // Should not happen with ref
    return;
  }

  // Unmount previous instance if exists
  if (odinDropinInstance) {
    odinDropinInstance.unmount();
    odinDropinInstance = null;
  }

  // Wait for the DOM to be ready, especially if container was conditionally rendered
  await nextTick();

  try {
    // Actual Drop-in Initialization Logic
    odinDropinInstance = new OdinDropin({
      odinPublicToken: odinPublicToken.value,
      isSingleUse: true, // Example for MVP
      config: {
        // theme: { primaryColor: '#007bff' } // Example theme, uncomment if you want to test
      },
      onSubmit: (result) => {
        console.log('Demo App onSubmit:', result);
        paymentMethodId.value = result.paymentMethodId;
        // Minimal visual feedback in demo
        errorMessage.value = null; 
      },
      onError: (error) => {
        console.error('Demo App onError:', error);
        errorMessage.value = `Error Code: ${error.code}${error.message ? ' - ' + error.message : ''}${error.field ? ' (Field: ' + error.field + ')' : ''}`;
        // Minimal visual feedback in demo
        paymentMethodId.value = null; 
      }
    });

    // 🧑‍💻 Pass the actual HTMLElement to mount
    odinDropinInstance.mount(dropinContainerRef.value); 
    console.log('Drop-in mount called on:', dropinContainerRef.value);
  } catch (error: any) {
    console.error('Failed to initialize or mount Drop-in:', error);
    errorMessage.value = `Failed to initialize Drop-in instance: ${error.message || error}`;
  }
}

// --- Lifecycle ---
onMounted(() => {
  // Auto-mount if token pre-filled (optional, for faster testing)
  // if (odinPublicToken.value && dropinContainerRef.value) {
  //   initializeAndMountDropin();
  // }
});

</script>

<template>
  <div class="demo-container">
    <h1>Exerp ODIN Drop-in Demo (Vue + TS)</h1>

    <div class="config-section">
      <label for="publicToken">ODIN Public Token:</label>
      <input
        id="publicToken"
        type="text"
        v-model="odinPublicToken"
        placeholder="Paste your test public token here"
      />
      <button @click="initializeAndMountDropin">Initialize & Mount Drop-in</button>
    </div>

    <div class="dropin-section">
      <h2>Drop-in Area:</h2>
      <div id="odin-dropin-container" ref="dropinContainerRef">
        <!-- The ODIN Drop-in will be mounted here -->
      </div>
    </div>

    <div class="results-section">
      <h2>Results:</h2>
      <div v-if="paymentMethodId" class="success-message">
        Success! Payment Method ID: <code>{{ paymentMethodId }}</code>
      </div>
      <div v-if="errorMessage" class="error-message">
        Error: <code>{{ errorMessage }}</code>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo-container {
  font-family: sans-serif;
  padding: 20px;
  max-width: 600px;
  margin: 40px auto;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.config-section,
.dropin-section,
.results-section {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px dashed #ddd;
  border-radius: 4px;
}

.config-section label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.config-section input[type="text"] {
  width: calc(100% - 22px); /* Adjust for padding/border */
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.config-section button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.config-section button:hover {
  background-color: #0056b3;
}

#odin-dropin-container {
  min-height: 100px; /* Ensure it has some space */
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #eee;
}

.results-section h2 {
  margin-bottom: 10px;
}

.success-message {
  color: green;
  background-color: #e9f7ef;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #b4e3cd;
}

.error-message {
  color: red;
  background-color: #fdeded;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #f1aeae;
}

code {
  font-family: monospace;
  background-color: #eee;
  padding: 2px 4px;
  border-radius: 3px;
}
</style>