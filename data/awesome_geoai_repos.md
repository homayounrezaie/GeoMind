# Awesome GeoAI Repository Sources

Last checked: 2026-05-27

This file collects GitHub "awesome" lists and closely related curated resource repositories that are useful for building AutoGeoSOTA: a Papers-with-Code-style catalogue for geospatial AI, remote sensing, Earth observation, GIS, climate AI, weather AI, and 3D geospatial vision.

Use these repositories as discovery sources. Do not treat every listed item as canonical until it is verified against the original paper, project page, dataset page, model card, benchmark page, or code repository.

## How to Use This File

| Target file | Use these repos for |
|---|---|
| `papers.csv` | Discover missing papers, venues, arXiv IDs, project pages, and code URLs |
| `datasets.csv` | Discover canonical dataset names, URLs, benchmark pages, tasks, modalities, and licenses |
| `foundation-models.csv` | Discover remote sensing foundation models, VLMs, agents, generative models, and weights |
| `techniques.csv` | Discover method families, algorithms, architectures, and training techniques |
| `tasks.csv` | Discover task names, applications, benchmark task taxonomies, and aliases |
| `metrics.csv` | Discover benchmark metrics used in detection, segmentation, retrieval, VQA, forecasting, and reconstruction |
| `benchmarks.csv` | Discover benchmark suites and leaderboard-style evaluation sets |

## Highest Priority for AutoGeoSOTA

| Repository | Scope | Useful for |
|---|---|---|
| [satellite-image-deep-learning/techniques](https://github.com/satellite-image-deep-learning/techniques) | Deep learning techniques, datasets, tools, production notes, and state of the art for satellite and aerial imagery | `papers.csv`, `tasks.csv`, `techniques.csv`, `datasets.csv` |
| [satellite-image-deep-learning/datasets](https://github.com/satellite-image-deep-learning/datasets) | Datasets for deep learning with satellite and aerial imagery, including Sentinel, Landsat, aerial, SAR, hyperspectral, benchmark, and dataset hub links | `datasets.csv`, `benchmarks.csv`, `tasks.csv` |
| [acgeospatial/awesome-earthobservation-code](https://github.com/acgeospatial/awesome-earthobservation-code) | Earth observation, geospatial satellite imagery tools, tutorials, code, projects, and links | `techniques.csv`, `datasets.csv`, `tasks.csv` |
| [Jack-bo1220/Awesome-Remote-Sensing-Foundation-Models](https://github.com/Jack-bo1220/Awesome-Remote-Sensing-Foundation-Models) | Remote sensing foundation models, datasets, benchmarks, code, weights, agents, VLMs, generative models | `foundation-models.csv`, `papers.csv`, `datasets.csv`, `benchmarks.csv` |
| [xiaoaoran/awesome-RSFMs](https://github.com/xiaoaoran/awesome-rsfms) | Foundation models for remote sensing and Earth observation survey repository | `foundation-models.csv`, `papers.csv`, `datasets.csv` |
| [ZhanYang-nwpu/Awesome-Remote-Sensing-Multimodal-Large-Language-Model](https://github.com/ZhanYang-nwpu/Awesome-Remote-Sensing-Multimodal-Large-Language-Model) | Multimodal large language models for remote sensing | `foundation-models.csv`, `papers.csv`, `tasks.csv` |
| [geoaigroup/awesome-vision-language-models-for-earth-observation](https://github.com/geoaigroup/awesome-vision-language-models-for-earth-observation) | Vision-language resources for Earth observation | `foundation-models.csv`, `papers.csv`, `datasets.csv`, `tasks.csv` |
| [lzw-lzw/awesome-remote-sensing-vision-language-models](https://github.com/lzw-lzw/awesome-remote-sensing-vision-language-models) | Remote sensing VLM methods, datasets, captioning, VQA, retrieval, pretraining | `foundation-models.csv`, `papers.csv`, `datasets.csv`, `tasks.csv` |
| [zytx121/Awesome-VLGFM](https://github.com/zytx121/Awesome-VLGFM) | Vision-language geo-foundation models, applications, datasets, and benchmarks | `foundation-models.csv`, `papers.csv`, `benchmarks.csv` |
| [VisionXLab/Awesome-RS-VL-Data](https://github.com/VisionXLab/Awesome-RS-VL-Data) | Remote sensing vision-language datasets and related lists | `datasets.csv`, `benchmarks.csv`, `tasks.csv` |
| [Bili-Sakura/awesome-remote-sensing-visual-generative-models](https://github.com/Bili-Sakura/awesome-remote-sensing-visual-generative-models) | Remote sensing visual generative models, satellite image synthesis, restoration, editing, metrics, datasets | `papers.csv`, `techniques.csv`, `metrics.csv`, `datasets.csv` |
| [PolyX-Research/Awesome-Remote-Sensing-Agents](https://github.com/PolyX-Research/Awesome-Remote-Sensing-Agents) | Remote sensing agents and agentic workflows | `foundation-models.csv`, `techniques.csv`, `tasks.csv` |
| [wenhwu/awesome-remote-sensing-change-detection](https://github.com/wenhwu/awesome-remote-sensing-change-detection) | Change detection datasets, methods, papers, contests, tools | `papers.csv`, `datasets.csv`, `benchmarks.csv`, `metrics.csv` |
| [chrieke/awesome-satellite-imagery-datasets](https://github.com/chrieke/awesome-satellite-imagery-datasets) | Satellite and aerial imagery training datasets with annotations; archived but still useful | `datasets.csv`, `benchmarks.csv` |
| [visionxiang/awesome-object-detection-in-aerial-images](https://github.com/visionxiang/awesome-object-detection-in-aerial-images) | Object detection in aerial images, oriented detection, small object detection, UAV detection, datasets | `papers.csv`, `datasets.csv`, `benchmarks.csv`, `metrics.csv` |
| [awesome-spectral-indices/awesome-spectral-indices](https://github.com/awesome-spectral-indices/awesome-spectral-indices) | Machine-readable spectral indices for remote sensing | `techniques.csv`, `tasks.csv`, `datasets.csv` |

## Remote Sensing AI and Computer Vision

| Repository | Scope | Useful for |
|---|---|---|
| [whut2962575697/Awesome-Deep-Learning-of-Remote-Sensing](https://github.com/whut2962575697/Awesome-Deep-Learning-of-Remote-Sensing) | Deep learning for remote sensing, baseline code, scene classification, semantic segmentation | `papers.csv`, `techniques.csv`, `tasks.csv` |
| [attibalazs/awesome-remote-sensing](https://github.com/attibalazs/awesome-remote-sensing) | General remote sensing resource list | `datasets.csv`, `techniques.csv` |
| [px39n/Awesome-Data-Fusion-for-Remote-Sensing](https://github.com/px39n/Awesome-Data-Fusion-for-Remote-Sensing) | Remote sensing data fusion papers and methods | `papers.csv`, `techniques.csv`, `tasks.csv` |
| [px39n/Awesome-Self-Supervised-Learning-for-Remote-Sensing](https://github.com/px39n/Awesome-Self-Supervised-Learning-for-Remote-Sensing) | Self-supervised learning in remote sensing | `papers.csv`, `techniques.csv`, `foundation-models.csv` |
| [likyoo/awesome-multimodal-remote-sensing-classification](https://github.com/likyoo/awesome-multimodal-remote-sensing-classification) | Multimodal, multisource, multisensor remote sensing classification | `papers.csv`, `datasets.csv`, `tasks.csv` |
| [LanCole/Awesome-Remote-Sensing-Cross-Modal-Image-Text-Retrieval](https://github.com/LanCole/Awesome-Remote-Sensing-Cross-Modal-Image-Text-Retrieval) | Remote sensing cross-modal image-text retrieval | `papers.csv`, `datasets.csv`, `metrics.csv` |
| [KyanChen/Awesome-Referring-Remote-Sensing-Image-Segmentation](https://github.com/KyanChen/Awesome-Referring-Remote-Sensing-Image-Segmentation) | Referring remote sensing image segmentation | `papers.csv`, `datasets.csv`, `tasks.csv`, `metrics.csv` |
| [LiShuo1001/awesome-few-shot-segmentation-in-remote-sensing](https://github.com/LiShuo1001/awesome-few-shot-segmentation-in-remote-sensing) | Few-shot segmentation in remote sensing | `papers.csv`, `techniques.csv`, `metrics.csv` |
| [daifeng2016/Awesome-Optical-Remote-Sensing-Datasets-and-Methods](https://github.com/daifeng2016/Awesome-Optical-Remote-Sensing-Datasets-and-Methods) | Optical remote sensing datasets and methods | `datasets.csv`, `papers.csv`, `techniques.csv` |
| [zhangda1018/Awesome-Remote-Sensing-Open-Vocabulary-Learning](https://github.com/zhangda1018/Awesome-Remote-Sensing-Open-Vocabulary-Learning) | Open-vocabulary learning for remote sensing | `papers.csv`, `techniques.csv`, `tasks.csv` |
| [BaoBao0926/Awesome-Mamba-in-Remote-Sensing](https://github.com/BaoBao0926/Awesome-Mamba-in-Remote-Sensing) | Mamba/state-space models in remote sensing | `papers.csv`, `techniques.csv`, `foundation-models.csv` |
| [sxf118/Awesome-Building-Extraction](https://github.com/sxf118/Awesome-Building-Extraction) | Building extraction datasets, products, and deep learning code | `datasets.csv`, `tasks.csv`, `benchmarks.csv` |
| [Nrevyw/awesome-hyperspectral](https://github.com/Nrevyw/awesome-hyperspectral) | Hyperspectral imagery software, papers, data sources, and resources | `datasets.csv`, `papers.csv`, `techniques.csv` |
| [ArminMoghimi/Awesome-Remote-Sensing-Relative-Radiometric-Normalization-Datasets](https://github.com/ArminMoghimi/Awesome-Remote-Sensing-Relative-Radiometric-Normalization-Datasets) | Relative radiometric normalization datasets | `datasets.csv`, `techniques.csv` |

## GeoAI, Geospatial ML, and Representation Learning

| Repository | Scope | Useful for |
|---|---|---|
| [joaootavio007/Awesome_GeoAI](https://github.com/joaootavio007/Awesome_GeoAI) | Computer vision and deep learning for remote sensing | `papers.csv`, `techniques.csv` |
| [AutoGeoAI4Sci/awesome-autonomous-geoai](https://github.com/AutoGeoAI4Sci/awesome-autonomous-geoai) | Autonomous GeoAI and AI for science | `foundation-models.csv`, `techniques.csv`, `tasks.csv` |
| [hfangcat/Awesome-Geospatial-Embeddings](https://github.com/hfangcat/Awesome-Geospatial-Embeddings) | Spatial, temporal, semantic, and Earth-data embeddings | `foundation-models.csv`, `techniques.csv`, `papers.csv` |
| [CityMind-Lab/Awesome-Geospatial-Representation-Learning](https://github.com/CityMind-Lab/Awesome-Geospatial-Representation-Learning) | Geospatial representation learning | `papers.csv`, `techniques.csv`, `foundation-models.csv` |
| [deepVector/geospatial-machine-learning](https://github.com/deepVector/geospatial-machine-learning) | Machine learning resources for geospatial data science | `techniques.csv`, `tasks.csv` |
| [mishagrol/Awesome-Geospatial-ML-Toolkit](https://github.com/mishagrol/Awesome-Geospatial-ML-Toolkit) | Environmental geospatial ML tools and resources | `techniques.csv`, `tasks.csv` |
| [usail-hkust/Awesome-Urban-Foundation-Models](https://github.com/usail-hkust/Awesome-Urban-Foundation-Models) | Urban foundation models and urban general intelligence | `foundation-models.csv`, `papers.csv`, `tasks.csv` |

## General GIS, Geospatial Software, and Data Infrastructure

| Repository | Scope | Useful for |
|---|---|---|
| [sshuair/awesome-gis](https://github.com/sshuair/awesome-gis) | Broad GIS resources: software, remote sensing, web maps, spatial databases, deep learning, data | `techniques.csv`, `datasets.csv`, `tasks.csv` |
| [sacridini/Awesome-Geospatial](https://github.com/sacridini/Awesome-Geospatial) | Long list of geospatial analysis tools and resources | `techniques.csv`, `tasks.csv`, `datasets.csv` |
| [elasticlabs/awesome-gis](https://github.com/elasticlabs/awesome-gis) | GIS data, software, cartography, geoanalysis, developer tools | `techniques.csv`, `datasets.csv` |
| [jerr0328/awesome-geospatial-list](https://github.com/jerr0328/awesome-geospatial-list) | Geospatial tools, data, tutorials, and information | `techniques.csv`, `datasets.csv` |
| [opengeos/Awesome-GEE](https://github.com/opengeos/Awesome-GEE) | Google Earth Engine resources | `techniques.csv`, `datasets.csv`, `tasks.csv` |
| [tmcw/awesome-geojson](https://github.com/tmcw/awesome-geojson) | GeoJSON utilities and operations | `techniques.csv`, `tasks.csv` |
| [DahnJ/Awesome-Zarr](https://github.com/DahnJ/Awesome-Zarr) | Zarr resources, cloud-native arrays, STAC/Zarr links | `datasets.csv`, `techniques.csv` |
| [softwareunderground/awesome-open-geoscience](https://github.com/softwareunderground/awesome-open-geoscience) | Open-source geoscience software, data, tutorials, and resources | `datasets.csv`, `techniques.csv`, `tasks.csv` |
| [pangeo-data/awesome-open-climate-science](https://github.com/pangeo-data/awesome-open-climate-science) | Atmospheric, ocean, climate, hydrology, remote sensing, GIS, and geospatial science software | `datasets.csv`, `techniques.csv`, `tasks.csv` |
| [edieraristizabal/Awesome-GDS](https://github.com/edieraristizabal/Awesome-GDS) | Geospatial data science resources | `techniques.csv`, `datasets.csv` |

## Geospatial and Remote Sensing Data Sources

| Repository | Scope | Useful for |
|---|---|---|
| [iamtekson/awesome-geospatial-data-sources](https://github.com/iamtekson/awesome-geospatial-data-sources) | Open geospatial data download sites | `datasets.csv` |
| [kartoza/awesome-geodata](https://github.com/kartoza/awesome-geodata) | Geospatial data sources and services | `datasets.csv` |
| [satellite-image-deep-learning/datasets](https://github.com/satellite-image-deep-learning/datasets) | Satellite and aerial imagery dataset catalogue for deep learning | `datasets.csv`, `benchmarks.csv` |
| [awesomedata/awesome-public-datasets](https://github.com/awesomedata/awesome-public-datasets) | Public datasets across domains, including geospatial and climate data | `datasets.csv` |
| [okhosting/awesome-open-data](https://github.com/okhosting/awesome-open-data) | Open datasets for machine learning and research | `datasets.csv` |
| [RS-GISer/Awesome-Satellite-Imagery-Datasets](https://github.com/RS-GISer/Awesome-Satellite-Imagery-Datasets) | Satellite imagery datasets for segmentation, object extraction, change detection, and related tasks | `datasets.csv`, `benchmarks.csv` |
| [icey-zhang/Remote-Sensing-Dataset](https://github.com/icey-zhang/Remote-Sensing-Dataset) | Remote sensing detection and classification datasets | `datasets.csv`, `benchmarks.csv` |
| [awesome-spectral-indices/awesome-ASI](https://github.com/awesome-spectral-indices/awesome-ASI) | Spectral indices resources, packages, tutorials, papers, and datasets | `techniques.csv`, `datasets.csv` |

## Climate AI, Weather AI, and Earth-System AI

| Repository | Scope | Useful for |
|---|---|---|
| [ESIPFed/Awesome-Earth-Artificial-Intelligence](https://github.com/ESIPFed/Awesome-Earth-Artificial-Intelligence) | Earth science AI tutorials, notebooks, software, datasets, courses, and books | `papers.csv`, `datasets.csv`, `techniques.csv` |
| [ai-boost/awesome-ai-for-science](https://github.com/ai-boost/awesome-ai-for-science) | AI for science, including remote sensing, geospatial AI, climate, weather, and Earth science | `foundation-models.csv`, `techniques.csv`, `papers.csv` |
| [HeQinWill/awesome-WeatherAI](https://github.com/HeQinWill/awesome-WeatherAI) | AI for weather forecasting and climate modeling | `papers.csv`, `datasets.csv`, `foundation-models.csv`, `metrics.csv` |
| [jaychempan/Awesome-LWMs](https://github.com/jaychempan/Awesome-LWMs) | Large weather models and AI for Earth | `foundation-models.csv`, `papers.csv`, `benchmarks.csv` |
| [zhengkai15/Awesome-Weather-Forecast](https://github.com/zhengkai15/Awesome-Weather-Forecast) | AI weather forecasting papers and code | `papers.csv`, `foundation-models.csv`, `metrics.csv` |
| [hoonerg/Awesome-Diffusion-Models-for-Weather-Forecasting](https://github.com/hoonerg/Awesome-Diffusion-Models-for-Weather-Forecasting) | Diffusion models for weather forecasting, downscaling, assimilation, and climate modeling | `papers.csv`, `techniques.csv`, `metrics.csv` |
| [tyui592/awesome-precipitation-nowcasting](https://github.com/tyui592/awesome-precipitation-nowcasting) | Precipitation nowcasting papers and resources | `papers.csv`, `datasets.csv`, `metrics.csv` |
| [protontypes/open-sustainable-technology](https://github.com/protontypes/open-sustainable-technology) | Open-source climate, biodiversity, natural resources, energy, and sustainability ecosystem | `datasets.csv`, `tasks.csv`, `applications` |

## 3D, LiDAR, Photogrammetry, NeRF, and Point Clouds

| Repository | Scope | Useful for |
|---|---|---|
| [awesome-photogrammetry/awesome-photogrammetry](https://github.com/awesome-photogrammetry/awesome-photogrammetry) | Photogrammetry, SfM, Gaussian splatting, calibration, datasets, benchmarks, tutorials | `tasks.csv`, `techniques.csv`, `datasets.csv` |
| [szenergy/awesome-lidar](https://github.com/szenergy/awesome-lidar) | LiDAR sensors, datasets, point-cloud algorithms, frameworks, simulators, SLAM, segmentation | `datasets.csv`, `techniques.csv`, `tasks.csv` |
| [openMVG/awesome_3DReconstruction_list](https://github.com/openMVG/awesome_3DReconstruction_list) | 3D reconstruction from images | `techniques.csv`, `tasks.csv` |
| [bluestyle97/awesome-3d-reconstruction-papers](https://github.com/bluestyle97/awesome-3d-reconstruction-papers) | 3D reconstruction papers in the deep learning era | `papers.csv`, `techniques.csv`, `tasks.csv` |
| [PolySummit/Awesome-3D-Reconstruction-and-Generation](https://github.com/PolySummit/Awesome-3D-Reconstruction-and-Generation) | 3D reconstruction and generation papers, datasets, projects | `papers.csv`, `techniques.csv`, `tasks.csv` |
| [imbinwang/awesome-nerf-3d-reconstruction](https://github.com/imbinwang/awesome-nerf-3d-reconstruction) | NeRF and 3D reconstruction resources | `techniques.csv`, `tasks.csv` |
| [mdyao/Awesome-3D-AIGC](https://github.com/mdyao/Awesome-3D-AIGC) | 3D generative AI resources, including scene generation and SLAM-adjacent work | `techniques.csv`, `tasks.csv` |

## Optional Ecosystem Lists

| Repository | Scope | Useful for |
|---|---|---|
| [chrieke/awesome-geospatial-companies](https://github.com/chrieke/awesome-geospatial-companies) | Geospatial companies across GIS, Earth observation, UAV, satellite, and digital farming | ecosystem research only |
| [YanCheng-go/Awesome-Geospatial-Intelligence-Companies](https://github.com/YanCheng-go/Awesome-Geospatial-Intelligence-Companies) | Geospatial intelligence companies, GIS, remote sensing, climate risk | ecosystem research only |
| [awesomelistsio/awesome-sustainability](https://github.com/awesomelistsio/awesome-sustainability) | Sustainability tools, projects, frameworks, communities, and resources | applications and ecosystem research |
| [open-risk/awesome-sustainable-finance](https://github.com/open-risk/awesome-sustainable-finance) | Sustainable finance data and resources | applications and climate-risk use cases |

## Import Notes

- Prefer primary sources when adding a paper, dataset, model, or benchmark.
- Awesome lists are useful for discovery, but they often contain stale links, forks, duplicate entries, and project pages that are not canonical.
- For every discovered paper, capture at least `title`, `year`, `authors`, `venue`, `arxiv_id` or `doi`, `url`, `code_url`, `task`, `method_family`, and `uses_datasets` when available.
- For every discovered dataset, capture canonical `name`, `url`, `task_categories`, `tags`, `description`, and source evidence.
- If a repository lists a benchmark but no leaderboard, add it to `benchmarks.csv` only after identifying the evaluation task, dataset split, metric, and source paper.
- For model repositories, distinguish `foundation model`, `architecture`, `framework`, `checkpoint`, and `paper-only method`.
