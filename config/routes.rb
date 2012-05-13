Webapp::Application.routes.draw do
  match '/map' => 'application#map'
  match '/upload' => 'application#upload'
  root to: 'application#index'
end
