<template>
  <!--?xml version="1.0" encoding="UTF-8" standalone="no"?-->
  <v-overlay
    :value="active"
    color="white"
    opacity="1"
    class="align-center justify-center loader-overlay"
    :class="{ 'loader-overlay--inactive': !active }"
  >
    <transition
      name="loader-fade"
      @before-enter="beforeEnter"
      @enter="enter"
      @leave="leave"
    >
      <div v-if="active" class="logo-container">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="280"
          height="280"
          viewBox="0 0 442.31067 372.62268"
          class="loader-logo"
          :class="{ 'loader-logo--active': active }"
        >
          <defs>
            <clipPath id="clipPath18">
              <path d="M 0,279.467 H 331.733 V 0 H 0 Z" class="IEA_0" />
            </clipPath>
          </defs>
          <g transform="matrix(1.3333333,0,0,-1.3333333,0,372.62267)">
            <g>
              <g clip-path="url(#clipPath18)">
                <g transform="translate(50.2753,39.9094)">
                  <path
                    d="m 0,0 -5.519,13.695 h -1.658 l -5.519,-13.626 -2.005,-0.63 v -0.721 h 5.248 v 0.698 L -11.335,0 -9.85,3.912 h 5.791 l 1.535,-4.053 -2.426,-0.443 v -0.698 h 6.955 v 0.721 z m -4.454,4.936 h -5.025 l 2.401,6.313 h 0.199 z m 20.316,7.245 2.079,0.652 v 0.722 h -5.37 V 12.833 L 14.526,12.181 10.195,1.535 5.864,12.391 8.363,12.833 v 0.722 H 1.014 v -0.722 l 2.227,-0.56 5.791,-13.695 h 1.089 z M 31.75,0 26.231,13.695 H 24.572 L 19.054,0.069 17.049,-0.561 v -0.721 h 5.246 v 0.698 L 20.415,0 21.899,3.912 h 5.792 L 29.225,-0.141 26.8,-0.584 v -0.698 h 6.955 v 0.721 z m -4.454,4.936 h -5.025 l 2.401,6.313 h 0.198 z m 10.32,-4.844 -2.202,-0.653 v -0.721 h 5.937 v 0.721 L 38.9,0.092 v 11.319 h 0.298 l 7.921,-10.458 1.782,-2.375 h 1.235 v 13.603 l 2.202,0.652 v 0.722 h -5.937 v -0.722 l 2.452,-0.652 V 2.865 h -0.272 l -6.215,8.315 -1.782,2.375 h -5.17 v -0.768 l 2.202,-0.629 z m 30.955,2.585 -0.52,0.163 -2.648,-3.101 c -0.57,-0.232 -1.212,-0.349 -1.956,-0.349 -3.563,0 -6.211,2.308 -6.211,6.898 0,4.101 2.129,6.711 5.073,6.711 2.302,0 3.737,-1.491 5.197,-4.056 l 0.693,0.047 -0.198,4.986 h -0.693 l -0.767,-0.817 c -1.063,0.444 -2.401,0.745 -3.811,0.745 -4.405,0 -8.288,-3.143 -8.288,-7.849 0,-4.708 3.462,-7.686 8.485,-7.686 2.204,0 3.59,0.418 5.173,1.232 z M 83.989,13.555 H 71.395 v -0.72 l 2.697,-0.443 V -0.121 l -2.697,-0.441 v -0.72 h 13.657 l 0.67,4.494 -0.496,0.095 -1.83,-2.448 c -0.62,-0.863 -1.017,-1.026 -2.477,-1.026 h -4.405 v 5.874 h 1.46 c 1.485,0 2.005,-0.397 2.5,-2.028 l 0.223,-0.722 h 0.619 V 9.456 H 80.697 L 80.474,8.687 c -0.47,-1.631 -1.015,-2.003 -2.5,-2.003 h -1.46 v 5.779 h 3.268 c 1.534,0 1.905,-0.209 2.747,-1.164 l 1.583,-1.843 0.471,0.163 z m 16.483,0 H 87.878 v -0.72 l 2.697,-0.443 V -0.121 l -2.697,-0.441 v -0.72 h 13.657 l 0.668,4.494 -0.495,0.095 -1.831,-2.448 c -0.618,-0.863 -1.015,-1.026 -2.475,-1.026 h -4.405 v 5.874 h 1.46 c 1.485,0 2.005,-0.397 2.5,-2.028 L 97.18,2.957 h 0.619 V 9.456 H 97.18 L 96.957,8.687 c -0.47,-1.631 -1.015,-2.003 -2.5,-2.003 h -1.46 v 5.779 h 3.267 c 1.535,0 1.905,-0.209 2.747,-1.164 l 1.584,-1.843 0.47,0.163 z M 115.469,3.026 c 0,1.771 -0.964,2.912 -2.968,3.821 -0.916,0.42 -1.732,0.723 -2.599,1.072 -1.734,0.699 -2.402,1.515 -2.402,2.842 0,1.468 1.039,2.378 2.402,2.378 1.708,0 2.773,-0.91 4.133,-3.681 l 0.765,0.046 -0.418,4.472 h -0.765 l -0.645,-0.77 c -0.741,0.42 -1.585,0.698 -2.847,0.698 -2.353,0 -4.676,-1.512 -4.676,-4.214 0,-1.842 0.963,-2.913 2.719,-3.728 0.768,-0.35 1.461,-0.583 2.254,-0.909 2.302,-0.908 2.995,-1.772 2.995,-3.192 0,-1.654 -1.212,-2.726 -3.019,-2.726 -2.056,0 -3.319,1.001 -4.752,4.311 l -0.742,-0.048 0.298,-5.1 h 0.766 l 0.642,0.769 c 0.939,-0.42 2.351,-0.698 3.615,-0.698 2.425,0 5.244,1.512 5.244,4.657 m 10.125,9.366 V -0.121 l -2.699,-0.441 v -0.72 h 7.671 c 5.175,0 8.735,3.212 8.735,7.43 0,4.195 -3.188,7.407 -8.586,7.407 h -7.82 v -0.72 z m 10.913,-6.244 c 0,-4.73 -2.425,-6.384 -5.743,-6.384 h -2.749 V 12.51 h 2.204 c 3.516,0 6.288,-1.655 6.288,-6.362 m 17.768,7.407 h -12.596 v -0.72 l 2.699,-0.443 V -0.121 l -2.699,-0.441 v -0.72 h 13.66 l 0.667,4.494 -0.494,0.095 -1.832,-2.448 c -0.618,-0.863 -1.013,-1.026 -2.475,-1.026 H 146.8 v 5.874 h 1.46 c 1.486,0 2.005,-0.397 2.5,-2.028 l 0.223,-0.722 h 0.619 v 6.499 h -0.619 L 150.76,8.687 c -0.47,-1.631 -1.014,-2.003 -2.5,-2.003 h -1.46 v 5.779 h 3.268 c 1.534,0 1.905,-0.209 2.746,-1.164 l 1.584,-1.843 0.471,0.163 z M 176.102,9.41 c 0,2.47 -2.176,4.145 -5.84,4.145 h -7.25 v -0.72 l 2.698,-0.443 V -0.117 l -2.698,-0.444 v -0.721 h 7.895 v 0.721 l -2.774,0.444 v 5.24 c 0.792,-0.115 1.758,-0.209 2.575,-0.209 3.195,0 5.394,1.933 5.394,4.496 m -2.669,-0.094 c 0,-2.352 -1.313,-3.427 -3.592,-3.427 -0.743,0 -1.262,0.048 -1.708,0.117 v 6.48 c 0.496,0.094 1.09,0.14 1.708,0.14 2.156,0 3.592,-1.001 3.592,-3.31 M 191.146,0 185.627,13.695 h -1.658 l -5.518,-13.626 -2.005,-0.63 v -0.721 h 5.247 v 0.698 L 179.812,0 l 1.484,3.912 h 5.792 l 1.535,-4.053 -2.426,-0.443 v -0.698 h 6.955 v 0.721 z m -4.454,4.936 h -5.025 l 2.402,6.313 h 0.197 z m 21.084,4.824 c 0,2.331 -2.176,3.795 -5.987,3.795 h -7.349 v -0.72 l 2.697,-0.443 V -0.117 l -2.697,-0.444 v -0.721 h 7.695 v 0.721 l -2.576,0.444 v 5.615 h 0.867 c 1.411,0 2.005,-0.28 2.7,-1.632 l 1.386,-2.679 c 0.964,-1.839 1.533,-2.469 3.462,-2.469 h 2.425 v 0.698 c -1.337,0.141 -1.931,0.396 -2.499,0.934 -0.569,0.535 -1.162,1.794 -1.855,3.073 -0.569,1.025 -1.508,1.98 -2.821,2.376 v 0.256 c 2.821,0.535 4.552,1.747 4.552,3.705 m -2.695,-0.117 c 0,-2.168 -1.536,-3.17 -3.788,-3.17 h -1.734 v 6.037 c 0.496,0.094 1.041,0.139 1.734,0.139 2.303,0 3.788,-0.909 3.788,-3.006 m 11.827,-9.76 v 12.508 l 2.771,0.442 v 0.722 h -7.99 v -0.722 l 2.797,-0.442 V -0.117 l -2.797,-0.444 v -0.721 h 7.99 v 0.721 z m 16.21,3.143 c 0,1.771 -0.964,2.912 -2.967,3.821 -0.917,0.42 -1.734,0.723 -2.601,1.072 -1.733,0.699 -2.401,1.515 -2.401,2.842 0,1.468 1.04,2.378 2.401,2.378 1.708,0 2.774,-0.91 4.134,-3.681 l 0.767,0.046 -0.42,4.472 h -0.767 l -0.643,-0.77 c -0.743,0.42 -1.584,0.698 -2.846,0.698 -2.353,0 -4.677,-1.512 -4.677,-4.214 0,-1.842 0.964,-2.913 2.719,-3.728 0.767,-0.35 1.461,-0.583 2.253,-0.909 2.304,-0.908 2.997,-1.772 2.997,-3.192 0,-1.654 -1.213,-2.726 -3.022,-2.726 -2.054,0 -3.316,1.001 -4.749,4.311 l -0.742,-0.048 0.296,-5.1 h 0.768 l 0.64,0.769 c 0.94,-0.42 2.352,-0.698 3.615,-0.698 2.427,0 5.245,1.512 5.245,4.657"
                    class="IEA_1"
                  />
                </g>
                <g transform="translate(41.8593,63.0891)">
                  <path
                    d="m 0,0 v 12.509 l 2.772,0.441 v 0.723 h -7.99 V 12.95 l 2.796,-0.441 V 0 l -2.796,-0.442 v -0.722 h 7.99 v 0.722 z M 7.304,0.209 5.102,-0.442 v -0.722 h 5.936 v 0.722 L 8.587,0.209 V 11.53 h 0.298 l 7.921,-10.458 1.783,-2.377 h 1.235 v 13.603 l 2.202,0.652 v 0.723 H 16.088 V 12.95 L 18.54,12.298 V 2.982 h -0.272 l -6.214,8.316 -1.783,2.375 H 5.102 v -0.77 l 2.202,-0.628 z m 27.465,2.935 c 0,1.77 -0.964,2.912 -2.968,3.821 -0.915,0.419 -1.733,0.722 -2.6,1.071 -1.732,0.699 -2.401,1.515 -2.401,2.844 0,1.468 1.039,2.377 2.401,2.377 1.709,0 2.774,-0.909 4.134,-3.682 l 0.767,0.046 -0.42,4.472 h -0.766 l -0.645,-0.77 c -0.743,0.421 -1.584,0.7 -2.846,0.7 -2.353,0 -4.676,-1.512 -4.676,-4.214 0,-1.842 0.963,-2.914 2.72,-3.729 0.767,-0.351 1.46,-0.584 2.253,-0.909 2.302,-0.909 2.995,-1.772 2.995,-3.193 0,-1.655 -1.213,-2.726 -3.02,-2.726 -2.055,0 -3.318,1.001 -4.751,4.311 l -0.742,-0.046 0.297,-5.101 h 0.767 l 0.643,0.769 c 0.938,-0.42 2.35,-0.699 3.612,-0.699 2.427,0 5.246,1.511 5.246,4.658 m 17.32,6.152 -0.89,4.377 H 37.713 l -0.866,-4.377 0.495,-0.14 1.337,1.793 c 1.064,1.399 1.559,1.701 2.821,1.701 h 1.832 V 0 L 40.46,-0.442 v -0.722 h 8.165 v 0.722 L 45.754,0 v 12.65 h 1.658 c 1.287,0 1.757,-0.302 2.821,-1.701 L 51.569,9.156 Z M 59.118,0 v 12.509 l 2.772,0.441 v 0.723 H 53.898 V 12.95 l 2.798,-0.441 V 0 l -2.798,-0.442 v -0.722 h 7.992 v 0.722 z M 79.09,9.296 78.199,13.673 H 64.713 l -0.865,-4.377 0.494,-0.14 1.337,1.793 c 1.064,1.399 1.559,1.701 2.822,1.701 h 1.831 V 0 l -2.871,-0.442 v -0.722 h 8.164 v 0.722 L 72.753,0 v 12.65 h 1.659 c 1.287,0 1.757,-0.302 2.821,-1.701 L 78.57,9.156 Z m 15.075,3.002 V 4.121 c 0,-2.563 -1.461,-4.426 -4.159,-4.426 -2.872,0 -4.581,1.235 -4.581,4.379 v 8.435 l 2.699,0.441 v 0.723 H 80.503 V 12.95 l 2.45,-0.441 V 3.725 c 0,-3.565 2.323,-5.286 6.335,-5.286 3.936,0 6.135,2.444 6.135,5.566 v 8.293 l 2.203,0.652 v 0.723 H 91.961 V 12.95 Z m 20.339,-3.002 -0.891,4.377 h -13.485 l -0.866,-4.377 0.495,-0.14 1.337,1.793 c 1.064,1.399 1.558,1.701 2.821,1.701 h 1.832 V 0 l -2.872,-0.442 v -0.722 h 8.165 v 0.722 L 108.168,0 v 12.65 h 1.659 c 1.287,0 1.756,-0.302 2.821,-1.701 l 1.337,-1.793 z m 8.644,3.215 V -0.003 l -2.697,-0.441 v -0.72 h 7.67 c 5.173,0 8.735,3.212 8.735,7.431 0,4.194 -3.19,7.406 -8.588,7.406 h -7.817 v -0.721 z m 10.914,-6.244 c 0,-4.731 -2.427,-6.386 -5.743,-6.386 h -2.75 v 12.746 h 2.206 c 3.514,0 6.287,-1.654 6.287,-6.36 m 8.609,5.892 c 0,1.095 -0.669,1.864 -1.754,1.864 -0.867,0 -1.534,-0.676 -1.534,-1.467 0,-0.722 0.469,-1.235 1.113,-1.235 0.247,0 0.421,0.024 0.594,0.117 l 0.049,0.023 0.148,-0.07 C 141.114,10.319 140.2,9.086 138.715,8.015 l 0.446,-0.467 c 2.077,1.212 3.51,2.771 3.51,4.611 m 14.626,1.514 h -12.593 v -0.721 l 2.697,-0.441 V -0.003 l -2.697,-0.441 v -0.72 h 13.659 l 0.667,4.494 -0.495,0.095 -1.831,-2.448 c -0.62,-0.863 -1.015,-1.026 -2.475,-1.026 h -4.404 v 5.874 h 1.459 c 1.485,0 2.005,-0.396 2.499,-2.029 l 0.222,-0.722 h 0.62 v 6.498 h -0.62 L 153.783,8.804 C 153.312,7.173 152.769,6.8 151.284,6.8 h -1.459 v 5.78 h 3.265 c 1.535,0 1.906,-0.209 2.747,-1.165 l 1.584,-1.843 0.47,0.164 z m 18.76,-4.377 -0.891,4.377 h -13.485 l -0.866,-4.377 0.496,-0.14 1.335,1.793 c 1.065,1.399 1.56,1.701 2.821,1.701 h 1.832 V 0 l -2.872,-0.442 v -0.722 h 8.165 v 0.722 L 169.721,0 v 12.65 h 1.658 c 1.288,0 1.757,-0.302 2.822,-1.701 l 1.336,-1.793 z m 15.076,3.002 V 4.121 c 0,-2.563 -1.462,-4.426 -4.16,-4.426 -2.872,0 -4.581,1.235 -4.581,4.379 v 8.435 l 2.699,0.441 v 0.723 h -7.62 V 12.95 l 2.45,-0.441 V 3.725 c 0,-3.565 2.324,-5.286 6.333,-5.286 3.937,0 6.137,2.444 6.137,5.566 v 8.293 l 2.202,0.652 v 0.723 h -5.666 V 12.95 Z m 7.795,0.213 V -0.003 l -2.699,-0.441 v -0.72 h 7.671 c 5.174,0 8.735,3.212 8.735,7.431 0,4.194 -3.188,7.406 -8.587,7.406 h -7.819 v -0.721 z m 10.913,-6.244 c 0,-4.731 -2.424,-6.386 -5.744,-6.386 h -2.748 v 12.746 h 2.204 c 3.515,0 6.288,-1.654 6.288,-6.36 m 17.397,7.406 h -12.595 v -0.721 l 2.697,-0.441 V -0.003 l -2.697,-0.441 v -0.72 H 228.3 l 0.668,4.494 -0.494,0.095 -1.832,-2.448 c -0.617,-0.863 -1.015,-1.026 -2.475,-1.026 h -4.404 v 5.874 h 1.459 c 1.486,0 2.006,-0.396 2.501,-2.029 l 0.222,-0.722 h 0.62 v 6.498 h -0.62 L 223.723,8.804 C 223.252,7.173 222.708,6.8 221.222,6.8 h -1.459 v 5.78 h 3.266 c 1.536,0 1.905,-0.209 2.747,-1.165 l 1.584,-1.843 0.471,0.164 z M 241.863,3.144 c 0,1.77 -0.964,2.912 -2.967,3.821 -0.916,0.419 -1.733,0.722 -2.6,1.071 -1.733,0.699 -2.403,1.515 -2.403,2.844 0,1.468 1.042,2.377 2.403,2.377 1.708,0 2.773,-0.909 4.134,-3.682 l 0.767,0.046 -0.421,4.472 h -0.766 l -0.643,-0.77 c -0.742,0.421 -1.585,0.7 -2.849,0.7 -2.351,0 -4.676,-1.512 -4.676,-4.214 0,-1.842 0.965,-2.914 2.721,-3.729 0.767,-0.351 1.461,-0.584 2.254,-0.909 2.302,-0.909 2.996,-1.772 2.996,-3.193 0,-1.655 -1.214,-2.726 -3.021,-2.726 -2.056,0 -3.318,1.001 -4.751,4.311 l -0.743,-0.046 0.297,-5.101 h 0.768 l 0.641,0.769 c 0.94,-0.42 2.35,-0.699 3.615,-0.699 2.424,0 5.244,1.511 5.244,4.658"
                    class="IEA_2"
                  />
                </g>
                <g transform="translate(131.8358,58.1926)">
                  <path
                    d="M 0,0 C -0.287,0.521 -0.967,0.664 -1.623,0.366 -2.381,-0.01 -3.796,-1.163 -5.096,-2.217 l 0.265,-0.51 c 1.648,0.446 3.485,0.872 4.244,1.248 C 0.083,-1.109 0.288,-0.523 0,0"
                    class="IEA_3"
                  />
                </g>
                <g transform="translate(196.7182,81.3206)">
                  <path
                    d="m 0,0 c -0.287,0.522 -0.968,0.664 -1.623,0.367 -0.76,-0.376 -2.174,-1.529 -3.474,-2.583 l 0.266,-0.511 c 1.647,0.446 3.484,0.873 4.243,1.248 C 0.082,-1.109 0.286,-0.523 0,0"
                    class="IEA_4"
                  />
                </g>
                <g transform="translate(187.6986,174.0945)">
                  <path
                    d="M 0,0 V 5.57 H 0.435 L 0.836,8.04 0.153,8.564 H -0.934 L -1.642,8.04 -1.298,5.57 h 0.491 V 0 h -0.012 c -0.772,0.422 -1.889,0.689 -3.096,0.8 v 6.087 h 0.438 l 0.394,2.474 -0.68,0.524 H -4.849 L -5.554,9.361 -5.211,6.887 h 0.495 V 0.841 C -6.576,0.905 -8.507,0.632 -9.646,0 h -32.771 v 5.57 h 0.435 l 0.4,2.47 -0.683,0.524 h -1.086 l -0.705,-0.524 0.345,-2.47 h 0.49 V 0 h -0.025 c -0.764,0.419 -1.883,0.686 -3.084,0.8 v 6.087 h 0.434 l 0.403,2.474 -0.683,0.524 h -1.091 l -0.704,-0.524 0.341,-2.474 h 0.494 V 0.841 C -48.995,0.908 -50.931,0.635 -52.076,0 h -36.99 v -2.064 h 37.619 l 0.267,0.19 c 1.27,0.911 5.752,0.909 7.053,-0.003 l 0.267,-0.187 h 34.839 l 0.266,0.19 c 1.274,0.911 5.751,0.909 7.05,-0.003 l 0.267,-0.187 H 36.169 V 0 Z"
                    class="IEA_5"
                  />
                </g>
                <g transform="translate(161.2504,166.1653)">
                  <path
                    d="m 0,0 c -10.304,0 -18.693,-6.649 -18.693,-14.823 h 1.933 c 0,6.538 8.088,11.857 16.76,11.857 8.672,0 16.761,-5.319 16.761,-11.857 h 1.933 C 18.694,-6.649 10.308,0 0,0"
                    class="IEA_6"
                  />
                </g>
                <g transform="translate(203.6996,166.1653)">
                  <path
                    d="m 0,0 c -10.308,0 -18.697,-6.649 -18.697,-14.823 h 1.933 c 0,6.538 8.089,11.857 16.764,11.857 8.669,0 16.761,-5.319 16.761,-11.857 H 18.69 C 18.69,-6.649 10.301,0 0,0"
                    class="IEA_7"
                  />
                </g>
                <g transform="translate(118.8026,166.1653)">
                  <path
                    d="m 0,0 c -10.308,0 -18.694,-6.649 -18.694,-14.823 h 1.932 c 0,6.538 8.09,11.857 16.762,11.857 8.672,0 16.76,-5.319 16.76,-11.857 h 1.934 C 18.694,-6.649 10.305,0 0,0"
                    class="IEA_8"
                  />
                </g>
                <g transform="translate(182.4691,170.8074)">
                  <path
                    d="M 0,0 C -0.763,0 -2.344,-0.082 -3.461,-0.61 H -38.985 C -40.1,-0.082 -41.68,0 -42.445,0 c -0.761,0 -2.34,-0.082 -3.456,-0.61 h -37.934 l 1.936,-1.549 h 34.867 v -8.037 l 0.33,-0.232 c 0.84,-0.578 2.346,-0.765 3.484,-0.813 v -8.221 h 1.551 v 8.221 c 1.139,0.048 2.644,0.235 3.482,0.813 l 0.329,0.232 v 8.037 h 33.267 v -8.037 l 0.334,-0.232 c 0.831,-0.578 2.34,-0.765 3.481,-0.813 v -8.221 h 1.549 v 8.221 c 1.136,0.048 2.645,0.235 3.48,0.813 l 0.336,0.232 v 8.037 h 34.347 l 2.463,1.549 H 3.461 C 2.343,-0.082 0.762,0 0,0 m -39.401,-9.323 h -6.084 v 7.196 c 0.328,0.248 1.438,0.578 3.04,0.578 1.604,0 2.715,-0.33 3.044,-0.578 z m 42.442,0 h -6.083 v 7.196 c 0.327,0.248 1.438,0.578 3.042,0.578 1.6,0 2.712,-0.33 3.041,-0.578 z"
                    class="IEA_9"
                  />
                </g>
                <g transform="translate(117.331,189.3777)">
                  <path
                    d="m 0,0 v 0.991 c 3.935,0 4.503,0.809 4.503,5.547 v 15.407 c 0,4.738 -0.568,5.491 -4.503,5.491 v 1 h 12.795 v -1 c -3.932,0 -4.501,-0.753 -4.501,-5.491 V 6.538 C 8.294,1.8 8.863,0.991 12.795,0.991 V 0 Z"
                    class="IEA_10"
                  />
                </g>
                <g transform="translate(143.0155,190.3714)">
                  <path
                    d="m 0,0 c 3.928,0 4.5,0.807 4.5,5.544 v 15.405 c 0,4.738 -0.572,5.496 -4.5,5.496 v 0.994 h 21.607 l 0.426,-6.255 H 21.037 L 20.8,22.13 c -0.66,2.464 -1.134,3.557 -5.494,3.557 H 8.291 V 14.928 h 2.371 c 4.737,0 5.495,0.568 5.495,4.548 h 0.998 V 8.625 h -0.998 c 0,3.979 -0.758,4.55 -5.495,4.55 H 8.291 V 6.256 c 0,-4.738 0.565,-5.497 4.5,-5.497 h 4.079 c 4.356,0 4.877,1.086 5.495,3.601 l 0.237,0.946 h 0.993 l -0.375,-6.3 -23.22,0 z"
                    class="IEA_11"
                  />
                </g>
                <g transform="translate(181.1186,193.9754)">
                  <path
                    d="M 0,0 C -1.137,-2.563 -0.237,-3.607 3.7,-3.607 V -4.601 H -7.395 v 0.994 c 3.985,0 4.22,0.807 5.69,4.125 L 8.724,24.639 H 9.34 L 19.812,0.518 c 1.467,-3.318 1.706,-4.125 5.636,-4.125 V -4.601 H 12.327 v 0.994 c 3.929,0 4.834,0.997 3.694,3.607 L 13.747,5.256 H 2.277 Z M 7.965,18.354 3.033,6.936 h 9.911 z"
                    class="IEA_12"
                  />
                </g>
                <g transform="translate(161.2519,91.8313)">
                  <path
                    d="m 0,0 c -45.746,0 -82.957,37.216 -82.957,82.958 0,45.742 37.211,82.956 82.957,82.956 45.742,0 82.954,-37.214 82.954,-82.956 C 82.954,37.216 45.742,0 0,0 m 0,162.208 c -43.703,0 -79.249,-35.549 -79.249,-79.25 0,-43.703 35.546,-79.256 79.249,-79.256 43.699,0 79.251,35.553 79.251,79.256 0,43.701 -35.552,79.25 -79.251,79.25"
                    class="IEA_13"
                  />
                </g>
                <g transform="translate(161.2519,248.5745)">
                  <path
                    d="m 0,0 c -40.696,0 -73.802,-33.111 -73.802,-73.801 0,-40.696 33.106,-73.807 73.802,-73.807 40.699,0 73.803,33.111 73.803,73.807 C 73.803,-33.111 40.699,0 0,0 m 0,-149.364 c -41.663,0 -75.558,33.894 -75.558,75.563 0,41.659 33.895,75.553 75.558,75.553 41.661,0 75.555,-33.894 75.555,-75.553 0,-41.669 -33.894,-75.563 -75.555,-75.563"
                    class="IEA_14"
                  />
                </g>
                <g transform="translate(184.1967,132.8352)">
                  <path
                    d="m 0,0 c 0,1.267 1.149,2.258 2.946,2.258 1.423,0 2.709,-0.457 3.989,-1.505 l 0.914,1.21 C 6.446,3.087 5.004,3.655 2.984,3.655 c -2.626,0 -4.54,-1.575 -4.54,-3.791 0,-2.29 1.46,-3.319 4.639,-4.011 2.905,-0.613 3.598,-1.343 3.598,-2.648 0,-1.403 -1.226,-2.372 -3.08,-2.372 -1.918,0 -3.303,0.651 -4.745,1.956 l -0.971,-1.143 c 1.661,-1.483 3.462,-2.216 5.658,-2.216 2.744,0 4.719,1.54 4.719,3.93 0,2.138 -1.422,3.268 -4.506,3.932 C 0.711,-2.054 0,-1.32 0,0 m -8.164,-10.37 h 1.559 V 3.459 h -1.559 z m -6.476,9.641 c 0,-1.798 -1.485,-2.869 -3.559,-2.869 h -4.25 V 2.02 h 4.273 c 2.235,0 3.536,-1.025 3.536,-2.749 m 2.071,-9.641 -4.245,5.652 c 2.174,0.397 3.753,1.733 3.753,4.051 0,2.49 -1.953,4.126 -4.999,4.126 h -5.947 V -10.37 h 1.558 v 5.375 h 3.955 l 4.014,-5.375 z m -19.413,5.055 h -6.307 l 3.162,7.052 z m -2.394,8.875 h -1.459 l -6.305,-13.93 h 1.599 l 1.638,3.654 h 7.532 l 1.619,-3.654 h 1.681 z m -11.003,-4.567 c 0,-1.839 -1.502,-3.063 -3.798,-3.063 h -3.422 v 6.09 h 3.503 c 2.234,0 3.717,-1.025 3.717,-3.027 m 1.576,0.061 c 0,2.747 -2.054,4.405 -5.172,4.405 h -5.181 V -10.37 h 1.557 v 4.88 h 3.367 c 2.941,0 5.429,1.537 5.429,4.544"
                    class="IEA_15"
                  />
                </g>
              </g>
            </g>
          </g>
        </svg>
      </div>
    </transition>
  </v-overlay>
</template>
<script>
export default {
  props: {
    active: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    beforeEnter(el) {
      el.style.opacity = '0'
      el.style.transform = 'scale(0.8)'
    },
    enter(el, done) {
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight // trigger reflow
      el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
      el.style.opacity = '1'
      el.style.transform = 'scale(1)'
      setTimeout(done, 800)
    },
    leave(el, done) {
      el.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      el.style.opacity = '0'
      el.style.transform = 'scale(0.9)'
      setTimeout(done, 400)
    },
  },
}
</script>
<style scoped lang="scss">
$animation-duration: 3141ms;
$animation-easing: ease;

.loader-overlay {
  background: rgba(255, 255, 255, 1) !important;
  backdrop-filter: blur(3px);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.loader-overlay--inactive {
  opacity: 0;
  transform: scale(0.95);

  .logo-container {
    transform: scale(0.9);
    opacity: 0;
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

.loader-logo {
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
  max-width: 350px;
  height: auto;
}

/* Base state for all SVG elements */
[class^='IEA_'] {
  fill: transparent;
  stroke: #000;
  stroke-opacity: 1;
  fill-opacity: 1;
  fill-rule: nonzero;
}

/* Initial stroke configurations */
.IEA_0 {
  stroke-dasharray: 1223 1225;
  stroke-dashoffset: 1224;
}
.IEA_1 {
  stroke-dasharray: 1351 1353;
  stroke-dashoffset: 1352;
}
.IEA_2 {
  stroke-dasharray: 1311 1313;
  stroke-dashoffset: 1312;
}
.IEA_3,
.IEA_4 {
  stroke-dasharray: 13 15;
  stroke-dashoffset: 14;
}
.IEA_5 {
  stroke-dasharray: 335 337;
  stroke-dashoffset: 336;
}
.IEA_6,
.IEA_7,
.IEA_8 {
  stroke-dasharray: 102 104;
  stroke-dashoffset: 103;
}
.IEA_9 {
  stroke-dasharray: 372 374;
  stroke-dashoffset: 373;
}
.IEA_10 {
  stroke-dasharray: 96 98;
  stroke-dashoffset: 97;
}
.IEA_11 {
  stroke-dasharray: 184 186;
  stroke-dashoffset: 185;
}
.IEA_12 {
  stroke-dasharray: 169 171;
  stroke-dashoffset: 170;
}
.IEA_13 {
  stroke-dasharray: 1020 1022;
  stroke-dashoffset: 1021;
}
.IEA_14 {
  stroke-dasharray: 939 941;
  stroke-dashoffset: 940;
}
.IEA_15 {
  stroke-dasharray: 326 328;
  stroke-dashoffset: 327;
}

/* Fill animations */
@keyframes fill-standard {
  0%,
  35% {
    fill: transparent;
  }
  60% {
    fill: rgba(0, 0, 0, 0.3);
  }
  80% {
    fill: rgba(0, 0, 0, 0.7);
  }
  100% {
    fill: #000;
  }
}

@keyframes fill-circles {
  0%,
  35% {
    fill: transparent;
  }
  60% {
    fill: rgba(0, 0, 0, 0.2);
  }
  80% {
    fill: rgba(0, 0, 0, 0.5);
  }
  100% {
    fill: #000;
  }
}

/* Stroke fade animations */

@keyframes stroke-fade {
  0%,
  65% {
    stroke-opacity: 1;
  }
  80% {
    stroke-opacity: 0.5;
  }
  95% {
    stroke-opacity: 0.2;
  }
  100% {
    stroke-opacity: 0;
  }
}

/* Drawing animation */
@keyframes draw {
  100% {
    stroke-dashoffset: 0;
  }
}

/* Entrance animation for transition */
.loader-fade-enter-active,
.loader-fade-leave-active {
  transition: all 0.5s ease-in-out;
}

.loader-fade-enter,
.loader-fade-leave-to {
  opacity: 0;
}

/* Active state animations - consolidated per-element animations */
.loader-logo--active {
  /* Non-fill elements */
  .IEA_0 {
    animation: IEA_draw_0 $animation-duration $animation-easing 0ms 1 forwards;
  }
  .IEA_5 {
    animation: IEA_draw_5 $animation-duration $animation-easing 0ms 1 forwards;
  }

  /* Text elements (IEA_1-4) */
  .IEA_1 {
    animation: IEA_draw_1 $animation-duration $animation-easing 0ms 1 forwards,
      stroke-fade $animation-duration linear 0ms 1 forwards,
      fill-standard $animation-duration $animation-easing 0ms 1 forwards;
  }
  .IEA_2 {
    animation: IEA_draw_2 $animation-duration $animation-easing 0ms 1 forwards,
      stroke-fade $animation-duration linear 0ms 1 forwards,
      fill-standard $animation-duration $animation-easing 0ms 1 forwards;
  }
  .IEA_3 {
    animation: IEA_draw_3 $animation-duration $animation-easing 0ms 1 forwards,
      stroke-fade $animation-duration linear 0ms 1 forwards,
      fill-standard $animation-duration $animation-easing 0ms 1 forwards;
  }
  .IEA_4 {
    animation: IEA_draw_4 $animation-duration $animation-easing 0ms 1 forwards,
      stroke-fade $animation-duration linear 0ms 1 forwards,
      fill-standard $animation-duration $animation-easing 0ms 1 forwards;
  }

  /* Per-element standard fills with specific draw timings */
  .IEA_6 {
    animation: IEA_draw_6 $animation-duration $animation-easing 0ms 1 forwards,
      stroke-fade $animation-duration linear 0ms 1 forwards,
      fill-standard $animation-duration $animation-easing 0ms 1 forwards;
  }
  .IEA_7 {
    animation: IEA_draw_7 $animation-duration $animation-easing 0ms 1 forwards,
      stroke-fade $animation-duration linear 0ms 1 forwards,
      fill-standard $animation-duration $animation-easing 0ms 1 forwards;
  }
  .IEA_8 {
    animation: IEA_draw_8 $animation-duration $animation-easing 0ms 1 forwards,
      stroke-fade $animation-duration linear 0ms 1 forwards,
      fill-standard $animation-duration $animation-easing 0ms 1 forwards;
  }
  .IEA_9 {
    animation: IEA_draw_9 $animation-duration $animation-easing 0ms 1 forwards,
      stroke-fade $animation-duration linear 0ms 1 forwards,
      fill-standard $animation-duration $animation-easing 0ms 1 forwards;
  }
  .IEA_10 {
    animation: IEA_draw_10 $animation-duration $animation-easing 0ms 1 forwards,
      stroke-fade $animation-duration linear 0ms 1 forwards,
      fill-standard $animation-duration $animation-easing 0ms 1 forwards;
  }
  .IEA_11 {
    animation: IEA_draw_11 $animation-duration $animation-easing 0ms 1 forwards,
      stroke-fade $animation-duration linear 0ms 1 forwards,
      fill-standard $animation-duration $animation-easing 0ms 1 forwards;
  }
  .IEA_12 {
    animation: IEA_draw_12 $animation-duration $animation-easing 0ms 1 forwards,
      stroke-fade $animation-duration linear 0ms 1 forwards,
      fill-standard $animation-duration $animation-easing 0ms 1 forwards;
  }
  .IEA_13 {
    animation: IEA_draw_13 $animation-duration $animation-easing 0ms 1 forwards,
      stroke-fade $animation-duration linear 0ms 1 forwards,
      fill-circles $animation-duration $animation-easing 0ms 1 forwards;
  }
  .IEA_14 {
    animation: IEA_draw_14 $animation-duration $animation-easing 0ms 1 forwards,
      stroke-fade $animation-duration linear 0ms 1 forwards,
      fill-circles $animation-duration $animation-easing 0ms 1 forwards;
  }
  .IEA_15 {
    animation: IEA_draw_15 $animation-duration $animation-easing 0ms 1 forwards,
      stroke-fade $animation-duration linear 0ms 1 forwards,
      fill-standard $animation-duration $animation-easing 0ms 1 forwards;
  }
}

/* Optimized individual drawing keyframes - each with unique timing */
@keyframes IEA_draw_0 {
  5% {
    stroke-dashoffset: 1224;
  }
  30%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes IEA_draw_1 {
  8% {
    stroke-dashoffset: 1352;
  }
  35%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes IEA_draw_2 {
  10% {
    stroke-dashoffset: 1312;
  }
  40%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes IEA_draw_3 {
  12% {
    stroke-dashoffset: 14;
  }
  45%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes IEA_draw_4 {
  15% {
    stroke-dashoffset: 14;
  }
  50%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes IEA_draw_5 {
  15.74% {
    stroke-dashoffset: 336;
  }
  43.52%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes IEA_draw_6 {
  16.67% {
    stroke-dashoffset: 103;
  }
  44.44%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes IEA_draw_7 {
  17.59% {
    stroke-dashoffset: 103;
  }
  45.37%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes IEA_draw_8 {
  18.52% {
    stroke-dashoffset: 103;
  }
  46.3%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes IEA_draw_9 {
  19.44% {
    stroke-dashoffset: 373;
  }
  47.22%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes IEA_draw_10 {
  20.37% {
    stroke-dashoffset: 97;
  }
  48.15%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes IEA_draw_11 {
  21.3% {
    stroke-dashoffset: 185;
  }
  49.07%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes IEA_draw_12 {
  22.22% {
    stroke-dashoffset: 170;
  }
  50%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes IEA_draw_13 {
  23.15% {
    stroke-dashoffset: 1021;
  }
  50.93%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes IEA_draw_14 {
  24.07% {
    stroke-dashoffset: 940;
  }
  51.85%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes IEA_draw_15 {
  25% {
    stroke-dashoffset: 327;
  }
  52.78%,
  100% {
    stroke-dashoffset: 0;
  }
}
</style>
